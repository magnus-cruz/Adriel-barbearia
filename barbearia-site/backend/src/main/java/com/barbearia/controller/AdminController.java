package com.barbearia.controller;

import com.barbearia.model.*;
import com.barbearia.service.AdminSessionService;
import com.barbearia.service.AgendamentoService;
import com.barbearia.service.CatalogoService;
import com.barbearia.service.HorarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final String ADMIN_TOKEN = "barberco-admin-2026";

    private final AdminSessionService adminSessionService;
    private final CatalogoService catalogoService;
    private final HorarioService horarioService;
    private final AgendamentoService agendamentoService;

    public AdminController(AdminSessionService adminSessionService,
                           CatalogoService catalogoService,
                           HorarioService horarioService,
                           AgendamentoService agendamentoService) {
        this.adminSessionService = adminSessionService;
        this.catalogoService = catalogoService;
        this.horarioService = horarioService;
        this.agendamentoService = agendamentoService;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> payload) {
        try {
            String token = adminSessionService.login(payload.get("usuario"), payload.get("senha"));
            return Map.of("token", token);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, e.getMessage());
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Void> check(@RequestHeader(value = "Authorization", required = false) String authorization) {
        validarToken(authorization);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/servicos")
    public List<Servico> listarServicos(@RequestHeader("Authorization") String authorization) {
        validarToken(authorization);
        return catalogoService.listarServicos();
    }

    @PostMapping("/servicos")
    public Servico criarServico(@RequestHeader("Authorization") String authorization, @RequestBody Servico servico) {
        validarToken(authorization);
        return catalogoService.salvarServico(servico);
    }

    @PutMapping("/servicos/{id}")
    public Servico atualizarServico(@RequestHeader("Authorization") String authorization,
                                    @PathVariable Long id,
                                    @RequestBody Servico servico) {
        validarToken(authorization);
        return catalogoService.atualizarServico(id, servico);
    }

    @DeleteMapping("/servicos/{id}")
    public void excluirServico(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        validarToken(authorization);
        catalogoService.excluirServico(id);
    }

    @GetMapping("/horarios")
    public HorarioDisponivel getHorarios(@RequestHeader("Authorization") String authorization) {
        validarToken(authorization);
        return horarioService.getConfiguracao();
    }

    @PutMapping("/horarios")
    public HorarioDisponivel atualizarHorarios(@RequestHeader("Authorization") String authorization,
                                               @RequestBody HorarioDisponivel horarioDisponivel) {
        validarToken(authorization);
        return horarioService.salvarConfiguracao(horarioDisponivel);
    }

    @PostMapping("/horarios")
    public HorarioDisponivel atualizarHorariosPost(@RequestHeader("Authorization") String authorization,
                                                   @RequestBody HorarioDisponivel horarioDisponivel) {
        validarToken(authorization);
        return horarioService.salvarConfiguracao(horarioDisponivel);
    }

    @GetMapping("/imprevistos")
    public List<Imprevisto> listarImprevistos(@RequestHeader("Authorization") String authorization) {
        validarToken(authorization);
        return horarioService.listarImprevistos();
    }

    @PostMapping("/imprevistos")
    public Imprevisto criarImprevisto(@RequestHeader("Authorization") String authorization, @RequestBody Imprevisto imprevisto) {
        validarToken(authorization);
        return horarioService.adicionarImprevisto(imprevisto);
    }

    @DeleteMapping("/imprevistos/{id}")
    public void excluirImprevisto(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        validarToken(authorization);
        horarioService.removerImprevisto(id);
    }

    @GetMapping("/midias")
    public List<Midia> listarMidias(@RequestHeader("Authorization") String authorization) {
        validarToken(authorization);
        return catalogoService.listarMidias();
    }

    @GetMapping("/cursos")
    public List<Curso> listarCursos(@RequestHeader("Authorization") String authorization) {
        validarToken(authorization);
        return catalogoService.listarCursos();
    }

    @PostMapping("/cursos")
    public Curso criarCurso(@RequestHeader("Authorization") String authorization, @RequestBody Curso curso) {
        validarToken(authorization);
        return catalogoService.salvarCurso(curso);
    }

    @PutMapping("/cursos/{id}")
    public Curso editarCurso(@RequestHeader("Authorization") String authorization,
                             @PathVariable Long id,
                             @RequestBody Curso curso) {
        validarToken(authorization);
        return catalogoService.atualizarCurso(id, curso);
    }

    @DeleteMapping("/cursos/{id}")
    public void excluirCurso(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        validarToken(authorization);
        catalogoService.excluirCurso(id);
    }

    @GetMapping("/agendamentos")
    public List<Agendamento> listarAgendamentos(@RequestHeader("Authorization") String authorization,
                                                @RequestParam(required = false) String data) {
        validarToken(authorization);
        String dataMin = (data == null || data.isBlank()) ? LocalDate.now().toString() : data;
        return agendamentoService.listarFuturos(dataMin);
    }

    @PutMapping("/agendamentos/{id}/cancelar")
    public ResponseEntity<?> cancelarAgendamento(@RequestHeader("Authorization") String authorization, @PathVariable Long id) {
        validarToken(authorization);
        Agendamento agendamento = agendamentoService.buscarPorId(id);

        // Impede recancelamento para manter o fluxo do painel consistente.
        if ("cancelado".equals(agendamento.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "mensagem", "Este agendamento ja esta cancelado"
            ));
        }

        return ResponseEntity.ok(agendamentoService.cancelar(id));
    }

    private void validarToken(String authorization) {
        if (!tokenValido(authorization)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nao autorizado.");
        }
    }

    private boolean tokenValido(String header) {
        if (header == null || header.isBlank()) return false;
        return ADMIN_TOKEN.equals(header.replace("Bearer ", "").trim());
    }
}
