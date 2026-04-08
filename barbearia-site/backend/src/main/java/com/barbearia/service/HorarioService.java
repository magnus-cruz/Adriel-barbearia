package com.barbearia.service;

import com.barbearia.model.Agendamento;
import com.barbearia.model.HorarioDisponivel;
import com.barbearia.model.Imprevisto;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

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
        long nextId = imprevistos.stream().map(Imprevisto::getId).filter(id -> id != null).max(Long::compareTo).orElse(0L) + 1;
        imprevisto.setId(nextId);
        imprevistos.add(imprevisto);
        jsonDataStore.writeList("imprevistos.json", imprevistos);
        return imprevisto;
    }

    public void removerImprevisto(Long id) {
        List<Imprevisto> imprevistos = listarImprevistos();
        imprevistos.removeIf(i -> i.getId().equals(id));
        jsonDataStore.writeList("imprevistos.json", imprevistos);
    }

    public List<String> gerarHorariosDisponiveis(String dataIso, List<Agendamento> agendamentosConfirmados) {
        HorarioDisponivel horarios = getConfiguracao();
        if (horarios.getConfiguracao() == null || horarios.getConfiguracao().getDiasSemana() == null) {
            return List.of();
        }

        LocalDate data = LocalDate.parse(dataIso);
        String diaKey = mapearDiaSemana(data.getDayOfWeek());
        Map<String, HorarioDisponivel.DiaSemanaConfig> dias = horarios.getConfiguracao().getDiasSemana();
        HorarioDisponivel.DiaSemanaConfig diaConfig = dias.get(diaKey);

        if (diaConfig == null || Boolean.FALSE.equals(diaConfig.getAtivo()) || diaConfig.getInicio() == null || diaConfig.getFim() == null) {
            return List.of();
        }

        if (isDataBloqueada(dataIso, listarImprevistos())) {
            return List.of();
        }

        int intervalo = horarios.getConfiguracao().getIntervaloPadrao() != null ? horarios.getConfiguracao().getIntervaloPadrao() : 30;
        LocalTime inicio = LocalTime.parse(diaConfig.getInicio(), HORA_FORMATTER);
        LocalTime fim = LocalTime.parse(diaConfig.getFim(), HORA_FORMATTER);

        Set<String> reservados = agendamentosConfirmados.stream()
                .filter(a -> dataIso.equals(a.getData()))
                .filter(a -> "confirmado".equalsIgnoreCase(a.getStatus()))
                .map(Agendamento::getHorario)
                .collect(Collectors.toSet());

        List<String> slots = new ArrayList<>();
        for (LocalTime t = inicio; t.isBefore(fim); t = t.plusMinutes(intervalo)) {
            String hora = t.format(HORA_FORMATTER);
            if (!reservados.contains(hora) && !isHorarioBloqueadoPorImprevisto(dataIso, hora, listarImprevistos())) {
                slots.add(hora);
            }
        }

        return slots.stream().sorted(Comparator.naturalOrder()).toList();
    }

    public boolean isHorarioBloqueadoPorImprevisto(String dataIso, String horario, List<Imprevisto> imprevistos) {
        for (Imprevisto i : imprevistos) {
            if (!dataIso.equals(i.getData())) {
                continue;
            }
            if ("dia_todo".equalsIgnoreCase(i.getPeriodo())) {
                return true;
            }
            LocalTime time = LocalTime.parse(horario, HORA_FORMATTER);
            if ("manha".equalsIgnoreCase(i.getPeriodo()) && time.isBefore(LocalTime.NOON)) {
                return true;
            }
            if ("tarde".equalsIgnoreCase(i.getPeriodo()) && !time.isBefore(LocalTime.NOON)) {
                return true;
            }
        }
        return false;
    }

    public boolean isDataBloqueada(String dataIso, List<Imprevisto> imprevistos) {
        return imprevistos.stream()
                .anyMatch(i -> dataIso.equals(i.getData()) && "dia_todo".equalsIgnoreCase(i.getPeriodo()));
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
