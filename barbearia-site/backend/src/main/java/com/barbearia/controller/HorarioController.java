package com.barbearia.controller;

import com.barbearia.model.HorarioDisponivel;
import com.barbearia.service.HorarioService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HorarioController {

    private final HorarioService horarioService;

    public HorarioController(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    @GetMapping("/horarios")
    public HorarioDisponivel getHorarios() {
        return horarioService.getConfiguracao();
    }

    @PostMapping("/admin/horarios")
    public HorarioDisponivel salvarHorarios(@RequestBody HorarioDisponivel horarios) {
        if (horarios == null || horarios.getConfiguracao() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Configuracao de horarios invalida.");
        }
        return horarioService.salvarConfiguracao(horarios);
    }

    @GetMapping("/horarios/disponiveis")
    public Map<String, Object> getDisponiveis(@RequestParam String data, @RequestParam String servico) {
        var horarios = horarioService.gerarHorariosDisponiveis(data, servico);
        return Map.of("data", data, "servico", servico, "horarios", horarios);
    }
}
