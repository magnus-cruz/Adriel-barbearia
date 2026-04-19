package com.barbearia.controller;

import com.barbearia.model.Agendamento;
import com.barbearia.service.AgendamentoService;
import com.barbearia.service.HorarioService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;
    private final HorarioService horarioService;

    public AgendamentoController(AgendamentoService agendamentoService, HorarioService horarioService) {
        this.agendamentoService = agendamentoService;
        this.horarioService = horarioService;
    }

    @GetMapping("/agendamentos")
    public List<Agendamento> listarTodos() {
        return agendamentoService.listarTodos();
    }

    @GetMapping("/agendamentos/disponibilidade")
    public Map<String, Object> disponibilidade(@RequestParam String data, @RequestParam(required = false) String servico) {
        List<String> horarios = horarioService.gerarHorariosDisponiveis(data, servico == null ? "" : servico);
        return Map.of("data", data, "horarios", horarios, "servico", servico == null ? "" : servico);
    }

    @PostMapping("/agendamentos")
    public Map<String, Object> criar(@RequestBody Agendamento agendamento) {
        try {
            return agendamentoService.criarComResposta(agendamento);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PatchMapping("/agendamentos/{id}/cancelar")
    public Agendamento cancelarCompat(@PathVariable Long id) {
        try {
            return agendamentoService.cancelar(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}
