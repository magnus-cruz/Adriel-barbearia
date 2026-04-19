package com.barbearia.controller;

import com.barbearia.model.Curso;
import com.barbearia.service.CatalogoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(value = "/api/cursos", produces = "application/json;charset=UTF-8")
public class CursoController {

    private final CatalogoService catalogoService;

    public CursoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping
    public List<Curso> listarCursos() {
        return catalogoService.listarCursos();
    }
}
