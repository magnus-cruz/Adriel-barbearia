package com.barbearia.service;

import com.barbearia.model.Agendamento;
import com.barbearia.model.Servico;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AgendamentoService {

    private final JsonDataStore jsonDataStore;
    private final HorarioService horarioService;

    public AgendamentoService(JsonDataStore jsonDataStore, HorarioService horarioService) {
        this.jsonDataStore = jsonDataStore;
        this.horarioService = horarioService;
    }

    public List<Agendamento> listarTodos() {
        return jsonDataStore.readList("agendamentos.json", new TypeReference<>() {
        });
    }

    public List<Agendamento> listarFuturos(String dataMinima) {
        return listarTodos().stream()
                .filter(a -> a.getData() != null && a.getData().compareTo(dataMinima) >= 0)
                .toList();
    }

    public Agendamento criar(Agendamento agendamento) {
        List<Agendamento> agendamentos = listarTodos();
        long nextId = agendamentos.stream().map(Agendamento::getId).filter(id -> id != null).max(Long::compareTo).orElse(0L) + 1;
        agendamento.setId(nextId);
        agendamento.setStatus("confirmado");

        List<String> disponiveis = horarioService.gerarHorariosDisponiveis(agendamento.getData(), agendamentos);
        if (!disponiveis.contains(agendamento.getHorario())) {
            throw new IllegalArgumentException("Horario indisponivel para esta data.");
        }

        agendamentos.add(agendamento);
        jsonDataStore.writeList("agendamentos.json", agendamentos);
        return agendamento;
    }

    public Agendamento cancelar(Long id) {
        List<Agendamento> agendamentos = listarTodos();
        for (Agendamento agendamento : agendamentos) {
            if (agendamento.getId().equals(id)) {
                agendamento.setStatus("cancelado");
                jsonDataStore.writeList("agendamentos.json", agendamentos);
                return agendamento;
            }
        }
        throw new IllegalArgumentException("Agendamento nao encontrado");
    }

    public List<Servico> listarServicos() {
        return jsonDataStore.readList("servicos.json", new TypeReference<>() {
        });
    }
}
