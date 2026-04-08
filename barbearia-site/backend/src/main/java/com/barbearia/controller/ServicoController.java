package com.barbearia.controller;

import com.barbearia.model.Servico;
import com.barbearia.service.CatalogoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    private final CatalogoService catalogoService;

    public ServicoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping
    public List<Servico> listarServicos() {
        return catalogoService.listarServicos().stream().filter(s -> Boolean.TRUE.equals(s.getAtivo())).toList();
    }
}
