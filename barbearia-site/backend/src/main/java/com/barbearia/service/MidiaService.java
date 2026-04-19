package com.barbearia.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class MidiaService {

    private static final long TAMANHO_MAXIMO_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> EXTENSOES_PERMITIDAS = Set.of("jpg", "jpeg", "png", "mp4");

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    public Path getUploadPath() {
        String baseProjeto = System.getProperty("user.dir");
        String pastaNormalizada = uploadDir
                .replace("\\", File.separator)
                .replace("/", File.separator);
        return Paths.get(baseProjeto + File.separator + pastaNormalizada).normalize();
    }

    public void garantirPastaUpload() throws IOException {
        Files.createDirectories(getUploadPath());
    }

    public void validarArquivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Nenhum arquivo foi enviado.");
        }

        if (file.getSize() > TAMANHO_MAXIMO_BYTES) {
            throw new IllegalArgumentException("Arquivo excede o limite de 10MB.");
        }

        String nomeOriginal = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().trim();
        String extensao = getExtensao(nomeOriginal);
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new IllegalArgumentException("Tipo de arquivo invalido. Permitidos: jpg, png, mp4.");
        }
    }

    public String salvar(MultipartFile file) throws IOException {
        garantirPastaUpload();

        String nomeOriginal = file.getOriginalFilename() == null ? "arquivo" : file.getOriginalFilename().trim();
        String extensao = getExtensao(nomeOriginal);
        String nomeSeguro = "upload-" + UUID.randomUUID() + "." + extensao;

        Path destino = getUploadPath().resolve(nomeSeguro).normalize();
        Files.copy(file.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
        return nomeSeguro;
    }

    public Path resolverArquivo(String filename) {
        Path arquivo = getUploadPath().resolve(filename).normalize();
        if (!arquivo.startsWith(getUploadPath())) {
            throw new IllegalArgumentException("Nome de arquivo invalido.");
        }
        return arquivo;
    }

    public boolean excluir(String nomeArquivo) throws IOException {
        Path arquivo = resolverArquivo(nomeArquivo);
        if (!Files.exists(arquivo)) {
            return false;
        }
        return Files.deleteIfExists(arquivo);
    }

    private String getExtensao(String nomeArquivo) {
        int indice = nomeArquivo.lastIndexOf('.');
        if (indice < 0 || indice == nomeArquivo.length() - 1) {
            return "";
        }
        return nomeArquivo.substring(indice + 1).toLowerCase(Locale.ROOT);
    }
}