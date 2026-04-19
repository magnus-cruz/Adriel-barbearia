package com.barbearia.controller;

import com.barbearia.model.Midia;
import com.barbearia.service.CatalogoService;
import com.barbearia.service.MidiaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*")
public class MidiaController {

    private static final Logger logger = LoggerFactory.getLogger(MidiaController.class);
    private static final String TOKEN_ADMIN = "barberco-admin-2026";
    private final MidiaService midiaService;
    private final CatalogoService catalogoService;

    public MidiaController(MidiaService midiaService, CatalogoService catalogoService) {
        this.midiaService = midiaService;
        this.catalogoService = catalogoService;
    }

    @PostMapping(
            value = "/api/admin/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = "application/json;charset=UTF-8"
    )
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file,
                                                       @RequestParam(value = "titulo", defaultValue = "Sem titulo") String titulo,
                                                       @RequestParam(value = "categoria", defaultValue = "galeria") String categoria,
                                                       @RequestHeader(value = "Authorization", required = false) String authHeader) {
        System.out.println("=== UPLOAD RECEBIDO ===");
        System.out.println("Arquivo: " + (file != null ? file.getOriginalFilename() : "(null)"));
        System.out.println("Titulo: " + titulo);
        System.out.println("Auth header: " + authHeader);

        try {
            // Valida token administrativo antes de aceitar uploads.
            if (!tokenValido(authHeader)) {
                System.out.println("Upload bloqueado: token invalido");
                return ResponseEntity.status(401).body(Map.of(
                        "status", "error",
                        "codigo", 401,
                        "mensagem", "Nao autorizado. Faca login novamente."
                ));
            }

            logger.info("Upload recebido: nome='{}', contentType='{}', tamanho={} bytes",
                    file.getOriginalFilename(), file.getContentType(), file.getSize());

            midiaService.validarArquivo(file);
            String nomeArquivo = midiaService.salvar(file);

            String tituloFinal = titulo == null ? "" : titulo.trim();
            String categoriaFinal = categoria == null ? "galeria" : categoria.trim().toLowerCase();

            if (tituloFinal.isBlank()) {
                throw new IllegalArgumentException("Informe um titulo para a imagem antes de enviar.");
            }

            if (categoriaFinal.isBlank()) {
                categoriaFinal = "galeria";
            }

            Midia midia = new Midia();
            midia.setId(UUID.randomUUID().toString());
            midia.setNomeArquivo(nomeArquivo);
            midia.setTipo(file.getContentType());
            midia.setCategoria(categoriaFinal);
            midia.setTitulo(tituloFinal);
            midia.setUrl("http://localhost:8080/api/uploads/" + nomeArquivo);
            midia.setTamanhoKb(Math.max(1L, file.getSize() / 1024L));
            midia.setDataUpload(LocalDate.now().format(DateTimeFormatter.ISO_DATE));
            catalogoService.salvarMidia(midia);
            String url = "http://localhost:8080/api/uploads/" + nomeArquivo;
            System.out.println("Upload salvo: " + url);

            Map<String, Object> arquivo = new LinkedHashMap<>();
            arquivo.put("id", midia.getId());
            arquivo.put("nome", nomeArquivo);
            arquivo.put("nomeArquivo", nomeArquivo);
            arquivo.put("url", url);
            arquivo.put("tipo", file.getContentType());
            arquivo.put("titulo", tituloFinal);
            arquivo.put("categoria", categoriaFinal);
            arquivo.put("tamanhoKb", Math.max(1L, file.getSize() / 1024L));
            arquivo.put("dataUpload", midia.getDataUpload());

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("status", "success");
            body.put("mensagem", "Arquivo enviado com sucesso.");
            body.put("arquivo", arquivo);
            return ResponseEntity.ok(body);
        } catch (IllegalArgumentException e) {
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("status", "error");
            erro.put("codigo", 400);
            erro.put("mensagem", e.getMessage());
            return ResponseEntity.badRequest().body(erro);
        } catch (Exception e) {
            logger.error("Falha ao salvar upload", e);
            System.err.println("Erro no upload: " + e.getMessage());
            Map<String, Object> erro = new LinkedHashMap<>();
            erro.put("status", "error");
            erro.put("codigo", 500);
            erro.put("mensagem", "Erro interno ao processar upload.");
            return ResponseEntity.internalServerError().body(erro);
        }
    }

    @DeleteMapping(value = "/api/admin/galeria/{nomeArquivo:.+}", produces = "application/json;charset=UTF-8")
    public ResponseEntity<Map<String, String>> excluirArquivo(@PathVariable String nomeArquivo,
                                                              @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Exclui apenas quando o token administrativo for valido.
            if (!tokenValido(authHeader)) {
                return ResponseEntity.status(401).body(Map.of(
                        "status", "error",
                        "mensagem", "Nao autorizado."
                ));
            }

            boolean deletado = midiaService.excluir(nomeArquivo);
            if (!deletado) {
                Map<String, String> erro = new LinkedHashMap<>();
                erro.put("status", "error");
                erro.put("mensagem", "Arquivo nao encontrado.");
                return ResponseEntity.status(404).body(erro);
            }

            catalogoService.excluirMidiaPorNomeArquivo(nomeArquivo);
            logger.info("Arquivo excluído: {}", nomeArquivo);

            Map<String, String> sucesso = new LinkedHashMap<>();
            sucesso.put("status", "success");
            sucesso.put("mensagem", "Imagem excluida com sucesso.");
            return ResponseEntity.ok(sucesso);
        } catch (IllegalArgumentException e) {
            Map<String, String> erro = new LinkedHashMap<>();
            erro.put("status", "error");
            erro.put("mensagem", "Arquivo nao encontrado.");
            return ResponseEntity.status(404).body(erro);
        } catch (IOException e) {
            Map<String, String> erro = new LinkedHashMap<>();
            erro.put("status", "error");
            erro.put("mensagem", "Erro interno ao excluir.");
            return ResponseEntity.status(500).body(erro);
        }
    }

    @GetMapping(value = "/api/galeria", produces = "application/json;charset=UTF-8")
    public ResponseEntity<List<Midia>> listarGaleria() {
        return ResponseEntity.ok(catalogoService.listarMidias());
    }

    @GetMapping("/api/uploads/{filename:.+}")
    public ResponseEntity<Resource> getUpload(@PathVariable String filename) throws IOException {
        Path arquivo = midiaService.resolverArquivo(filename);
        if (!Files.exists(arquivo)) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(arquivo);
        if (contentType == null || contentType.isBlank()) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        ByteArrayResource body = new ByteArrayResource(Files.readAllBytes(arquivo));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + arquivo.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(Files.size(arquivo))
                .body(body);
    }

    @GetMapping("/api/admin/uploads/{filename:.+}")
    public ResponseEntity<Resource> getUploadAdmin(@PathVariable String filename) throws IOException {
        return getUpload(filename);
    }

    private boolean tokenValido(String authHeader) {
        System.out.println("Header recebido: [" + authHeader + "]");

        if (authHeader == null || authHeader.isBlank()) {
            System.out.println("Token ausente ou vazio.");
            return false;
        }

        String token = authHeader.trim();

        if (token.startsWith("Bearer ")) {
            token = token.substring(7).trim();
        }

        System.out.println("Token extraido: [" + token + "]");
        System.out.println("Token esperado: [" + TOKEN_ADMIN + "]");

        boolean valido = TOKEN_ADMIN.equals(token);
        System.out.println("Token valido: " + valido);

        return valido;
    }
}
