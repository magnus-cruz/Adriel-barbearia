package com.barbearia.controller;

import com.barbearia.model.Midia;
import com.barbearia.service.AdminSessionService;
import com.barbearia.service.CatalogoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/midias")
public class MidiaController {

    private final CatalogoService catalogoService;
    private final AdminSessionService adminSessionService;
    private final Path uploadDir;

    public MidiaController(CatalogoService catalogoService,
                           AdminSessionService adminSessionService,
                           @Value("${app.upload-dir:uploads}") String uploadDir) throws IOException {
        this.catalogoService = catalogoService;
        this.adminSessionService = adminSessionService;
        this.uploadDir = Paths.get(uploadDir);
        Files.createDirectories(this.uploadDir);
    }

    @GetMapping
    public List<Midia> listar() {
        return catalogoService.listarMidias();
    }

    @GetMapping("/file/{filename}")
    public ResponseEntity<byte[]> baixar(@PathVariable String filename) throws IOException {
        Path path = uploadDir.resolve(filename);
        if (!Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }
        String contentType = Files.probeContentType(path);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .body(Files.readAllBytes(path));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Midia uploadImagem(@RequestHeader(value = "Authorization", required = false) String authorization,
                              @RequestParam("arquivo") MultipartFile arquivo,
                              @RequestParam("categoria") String categoria,
                              @RequestParam("titulo") String titulo) throws IOException {
        validarToken(authorization);
        String nomeArquivo = UUID.randomUUID() + "-" + arquivo.getOriginalFilename();
        Path destino = uploadDir.resolve(nomeArquivo);
        Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

        Midia midia = new Midia();
        midia.setTipo("foto");
        midia.setCategoria(categoria);
        midia.setTitulo(titulo);
        midia.setUrl("/api/midias/file/" + nomeArquivo);

        return catalogoService.salvarMidia(midia);
    }

    @PostMapping("/video")
    public Midia cadastrarVideo(@RequestHeader(value = "Authorization", required = false) String authorization,
                                @RequestBody Midia video) {
        validarToken(authorization);
        video.setTipo("video");
        return catalogoService.salvarMidia(video);
    }

    @DeleteMapping("/{id}")
    public void excluir(@RequestHeader(value = "Authorization", required = false) String authorization,
                        @PathVariable Long id) {
        validarToken(authorization);
        catalogoService.excluirMidia(id);
    }

    private void validarToken(String authorization) {
        String token = null;
        if (authorization != null && authorization.startsWith("Bearer ")) {
            token = authorization.substring(7);
        }
        if (!adminSessionService.isTokenValido(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalido ou expirado");
        }
    }
}
