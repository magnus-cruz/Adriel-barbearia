package com.barbearia.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.Writer;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JsonDataStore {

    private final ObjectMapper mapper;
    private final Path dataDir;
    private final Path legacyDataDir;

    public JsonDataStore(@Value("${data.dir:data}") String dataDirPath) throws IOException {
        this.mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
        Path configuredPath = Paths.get(dataDirPath);
        this.dataDir = configuredPath.isAbsolute()
                ? configuredPath
                : Paths.get(System.getProperty("user.dir")).resolve(configuredPath).normalize();
        this.legacyDataDir = Paths.get(System.getProperty("user.dir"), "src", "main", "resources", "data").normalize();
        Files.createDirectories(this.dataDir);
    }

    public synchronized <T> List<T> readList(String fileName, TypeReference<List<T>> typeReference) {
        try {
            Path file = dataDir.resolve(fileName);
            if (Files.notExists(file)) {
                migrarArquivoLegadoSeExistir(fileName, file);
            }
            if (Files.notExists(file)) {
                Files.writeString(file, "[]", StandardCharsets.UTF_8);
            }

            try (Reader reader = new InputStreamReader(Files.newInputStream(file), StandardCharsets.UTF_8)) {
                return mapper.readValue(reader, typeReference);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao ler arquivo: " + fileName, e);
        }
    }

    public synchronized <T> T readObject(String fileName, Class<T> clazz, T fallback) {
        try {
            Path file = dataDir.resolve(fileName);
            if (Files.notExists(file)) {
                migrarArquivoLegadoSeExistir(fileName, file);
                if (Files.notExists(file)) {
                    try (Writer writer = new OutputStreamWriter(Files.newOutputStream(file), StandardCharsets.UTF_8)) {
                        mapper.writeValue(writer, fallback);
                    }
                    return fallback;
                }
            }

            try (Reader reader = new InputStreamReader(Files.newInputStream(file), StandardCharsets.UTF_8)) {
                return mapper.readValue(reader, clazz);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao ler objeto JSON: " + fileName, e);
        }
    }

    public synchronized void writeList(String fileName, List<?> data) {
        try {
            Path file = dataDir.resolve(fileName);
            if (Files.notExists(file)) {
                Files.createFile(file);
            }
            try (Writer writer = new OutputStreamWriter(Files.newOutputStream(file), StandardCharsets.UTF_8)) {
                mapper.writeValue(writer, data);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo: " + fileName, e);
        }
    }

    public synchronized void writeObject(String fileName, Object data) {
        try {
            Path file = dataDir.resolve(fileName);
            if (Files.notExists(file)) {
                Files.createFile(file);
            }
            try (Writer writer = new OutputStreamWriter(Files.newOutputStream(file), StandardCharsets.UTF_8)) {
                mapper.writeValue(writer, data);
            }
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar objeto JSON: " + fileName, e);
        }
    }

    public Path getDataDir() {
        return dataDir;
    }

    private void migrarArquivoLegadoSeExistir(String fileName, Path destino) throws IOException {
        Path legado = legacyDataDir.resolve(fileName);
        if (Files.exists(legado) && Files.notExists(destino)) {
            Files.copy(legado, destino);
        }
    }
}
