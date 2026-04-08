package com.barbearia.controller;

import com.barbearia.model.Agendamento;
import com.barbearia.service.AgendamentoService;
import com.barbearia.service.HorarioService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;
    private final HorarioService horarioService;

    public AgendamentoController(AgendamentoService agendamentoService, HorarioService horarioService) {
        this.agendamentoService = agendamentoService;
        this.horarioService = horarioService;
    }

    @GetMapping
    public List<Agendamento> listarTodos(@RequestParam(required = false) String dataMinima) {
        if (dataMinima == null || dataMinima.isBlank()) {
            dataMinima = LocalDate.now().toString();
        }
        return agendamentoService.listarFuturos(dataMinima);
    }

    @GetMapping("/disponibilidade")
    public Map<String, Object> disponibilidade(@RequestParam String data) {
        List<String> horarios = horarioService.gerarHorariosDisponiveis(data, agendamentoService.listarTodos());
        return Map.of("data", data, "horarios", horarios);
    }

    @PostMapping
    public Agendamento criar(@RequestBody Agendamento agendamento) {
        try {
            return agendamentoService.criar(agendamento);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancelar")
    public Agendamento cancelar(@PathVariable Long id) {
        try {
            return agendamentoService.cancelar(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}
