package com.barbearia.service;

import com.barbearia.model.Agendamento;
import com.barbearia.model.HorarioDisponivel;
import com.barbearia.model.Imprevisto;
import com.barbearia.model.Servico;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class HorarioService {

    private static final DateTimeFormatter HORA_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final JsonDataStore jsonDataStore;

    public HorarioService(JsonDataStore jsonDataStore) {
        this.jsonDataStore = jsonDataStore;
    }

    public HorarioDisponivel getConfiguracao() {
        HorarioDisponivel fallback = new HorarioDisponivel();
        HorarioDisponivel.Configuracao cfg = new HorarioDisponivel.Configuracao();
        cfg.setIntervaloPadrao(30);
        fallback.setConfiguracao(cfg);
        return jsonDataStore.readObject("horarios.json", HorarioDisponivel.class, fallback);
    }

    public HorarioDisponivel salvarConfiguracao(HorarioDisponivel horarioDisponivel) {
        jsonDataStore.writeObject("horarios.json", horarioDisponivel);
        return horarioDisponivel;
    }

    public List<Imprevisto> listarImprevistos() {
        return jsonDataStore.readList("imprevistos.json", new TypeReference<>() {
        });
    }

    public Imprevisto adicionarImprevisto(Imprevisto imprevisto) {
        List<Imprevisto> imprevistos = listarImprevistos();
        long nextId = imprevistos.stream()
                .map(Imprevisto::getId)
                .filter(Objects::nonNull)
                .max(Long::compareTo)
                .orElse(0L) + 1;
        imprevisto.setId(nextId);
        imprevistos.add(imprevisto);
        jsonDataStore.writeList("imprevistos.json", imprevistos);
        return imprevisto;
    }

    public void removerImprevisto(Long id) {
        List<Imprevisto> imprevistos = listarImprevistos();
        imprevistos.removeIf(i -> Objects.equals(i.getId(), id));
        jsonDataStore.writeList("imprevistos.json", imprevistos);
    }

    public List<String> gerarHorariosDisponiveis(String dataIso, String servicoNome) {
        HorarioDisponivel config = getConfiguracao();
        HorarioDisponivel.DiaSemanaConfig diaConfig = getConfiguracaoDia(dataIso, config);
        if (diaConfig == null || !Boolean.TRUE.equals(diaConfig.getAtivo())) return List.of();
        if (diaConfig.getInicio() == null || diaConfig.getFim() == null) return List.of();

        List<Imprevisto> imprevistos = listarImprevistos();
        if (isDataBloqueada(dataIso, imprevistos)) return List.of();

        int intervalo = getIntervalo(config);
        int duracaoServico = getDuracaoServico(servicoNome);
        LocalTime inicioDia = LocalTime.parse(diaConfig.getInicio(), HORA_FORMATTER);
        LocalTime fimDia = LocalTime.parse(diaConfig.getFim(), HORA_FORMATTER);
        List<Agendamento> agendamentos = listarAgendamentosConfirmados(dataIso);
        Map<String, Integer> duracaoServicos = mapDuracaoServicos();

        List<String> slots = new ArrayList<>();
        for (LocalTime cursor = inicioDia; cursor.isBefore(fimDia); cursor = cursor.plusMinutes(intervalo)) {
            LocalTime fimServico = cursor.plusMinutes(duracaoServico);
            if (fimServico.isAfter(fimDia)) continue;
            String horario = cursor.format(HORA_FORMATTER);
            if (isHorarioBloqueadoPorImprevisto(dataIso, horario, imprevistos)) continue;
            if (isHorarioOcupado(dataIso, horario, duracaoServico, agendamentos, duracaoServicos)) continue;
            slots.add(horario);
        }
        return slots;
    }

    public boolean isDataBloqueada(String dataIso, List<Imprevisto> imprevistos) {
        return imprevistos.stream().anyMatch(i -> dataIso.equals(i.getData()) && "dia_todo".equalsIgnoreCase(i.getPeriodo()));
    }

    public boolean isHorarioBloqueadoPorImprevisto(String dataIso, String horario, List<Imprevisto> imprevistos) {
        LocalTime time = LocalTime.parse(horario, HORA_FORMATTER);
        for (Imprevisto i : imprevistos) {
            if (!dataIso.equals(i.getData())) continue;
            String periodo = Objects.toString(i.getPeriodo(), "").toLowerCase(Locale.ROOT);
            if ("dia_todo".equals(periodo)) return true;
            if ("manha".equals(periodo) && time.isBefore(LocalTime.NOON)) return true;
            if ("tarde".equals(periodo) && !time.isBefore(LocalTime.NOON)) return true;
        }
        return false;
    }

    public int getDuracaoServico(String nomeServico) {
        if (nomeServico == null || nomeServico.isBlank()) return 30;
        return mapDuracaoServicos().getOrDefault(nomeServico.trim().toLowerCase(Locale.ROOT), 30);
    }

    public HorarioDisponivel.DiaSemanaConfig getConfiguracaoDia(String dataIso, HorarioDisponivel horarios) {
        if (horarios.getConfiguracao() == null || horarios.getConfiguracao().getDiasSemana() == null) return null;
        LocalDate data = LocalDate.parse(dataIso);
        String diaKey = mapearDiaSemana(data.getDayOfWeek());
        return horarios.getConfiguracao().getDiasSemana().get(diaKey);
    }

    private int getIntervalo(HorarioDisponivel config) {
        if (config.getConfiguracao() == null || config.getConfiguracao().getIntervaloPadrao() == null) return 30;
        return config.getConfiguracao().getIntervaloPadrao();
    }

    private List<Agendamento> listarAgendamentosConfirmados(String dataIso) {
        List<Agendamento> todos = jsonDataStore.readList("agendamentos.json", new TypeReference<>() {
        });
        return todos.stream()
                .filter(a -> dataIso.equals(a.getData()))
                .filter(a -> "confirmado".equalsIgnoreCase(Objects.toString(a.getStatus(), "")))
                .toList();
    }

    private Map<String, Integer> mapDuracaoServicos() {
        List<Servico> servicos = jsonDataStore.readList("servicos.json", new TypeReference<>() {
        });
        Map<String, Integer> map = new HashMap<>();
        for (Servico servico : servicos) {
            if (servico.getNome() == null || servico.getDuracaoMinutos() == null) continue;
            map.put(servico.getNome().trim().toLowerCase(Locale.ROOT), servico.getDuracaoMinutos());
        }
        return map;
    }

    private boolean isHorarioOcupado(String dataIso,
                                     String novoHorario,
                                     int novaDuracao,
                                     List<Agendamento> agendamentos,
                                     Map<String, Integer> duracaoServicos) {
        LocalTime novoInicio = LocalTime.parse(novoHorario, HORA_FORMATTER);
        LocalTime novoFim = novoInicio.plusMinutes(novaDuracao);

        for (Agendamento agendamento : agendamentos) {
            if (!dataIso.equals(agendamento.getData())) continue;
            if (agendamento.getHorario() == null) continue;

            LocalTime inicioExistente = LocalTime.parse(agendamento.getHorario(), HORA_FORMATTER);
            int duracaoExistente = duracaoServicos.getOrDefault(
                    Objects.toString(agendamento.getServico(), "").trim().toLowerCase(Locale.ROOT),
                    30
            );
            LocalTime fimExistente = inicioExistente.plusMinutes(duracaoExistente);
            boolean sobrepoe = novoInicio.isBefore(fimExistente) && inicioExistente.isBefore(novoFim);
            if (sobrepoe) return true;
        }
        return false;
    }

    private String mapearDiaSemana(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, new Locale("pt", "BR")).toLowerCase(Locale.ROOT)) {
            case "segunda-feira" -> "segunda";
            case "terca-feira", "terça-feira" -> "terca";
            case "quarta-feira" -> "quarta";
            case "quinta-feira" -> "quinta";
            case "sexta-feira" -> "sexta";
            case "sabado", "sábado" -> "sabado";
            default -> "domingo";
        };
    }
}
