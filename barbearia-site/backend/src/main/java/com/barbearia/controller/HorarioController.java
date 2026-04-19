package com.barbearia.controller;

import com.barbearia.model.HorarioDisponivel;
import com.barbearia.service.HorarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping(value = "/api", produces = "application/json;charset=UTF-8")
public class HorarioController {

    private static final String ADMIN_TOKEN = "barberco-admin-2026";

    private final HorarioService horarioService;

    public HorarioController(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    @GetMapping("/horarios")
    public ResponseEntity<?> buscarHorarios() {
        try {
            return ResponseEntity.ok(horarioService.getConfiguracao());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "mensagem", "Erro ao buscar horários: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/admin/horarios")
    public ResponseEntity<?> salvarHorarios(
            @RequestBody HorarioDisponivel config,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (!tokenValido(authHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "status", "error",
                    "mensagem", "Não autorizado."
            ));
        }

        try {
            horarioService.salvarConfiguracao(config);
            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "mensagem", "Horários salvos com sucesso."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "mensagem", "Erro ao salvar horários: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/horarios/disponiveis")
    public ResponseEntity<?> horariosDisponiveis(@RequestParam String data,
                                                 @RequestParam(required = false) String servico) {
        try {
            List<String> slots = horarioService.calcularDisponiveis(data, servico);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", "error",
                    "mensagem", "Erro ao calcular horários: " + e.getMessage()
            ));
        }
    }

    private boolean tokenValido(String header) {
        if (header == null || header.isBlank()) return false;
        return ADMIN_TOKEN.equals(header.replace("Bearer ", "").trim());
    }
}
