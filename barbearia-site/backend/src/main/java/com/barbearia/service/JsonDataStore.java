package com.barbearia.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Component
public class JsonDataStore {

    private final ObjectMapper mapper;
    private final Path dataDir;

    public JsonDataStore(@Value("${app.data-dir:src/main/resources/data}") String dataDirPath) throws IOException {
        this.mapper = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);
        this.dataDir = Paths.get(dataDirPath);
        Files.createDirectories(this.dataDir);
    }

    public synchronized <T> List<T> readList(String fileName, TypeReference<List<T>> typeReference) {
        try {
            Path file = dataDir.resolve(fileName);
            if (Files.notExists(file)) {
                Files.writeString(file, "[]");
            }
            return mapper.readValue(file.toFile(), typeReference);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao ler arquivo: " + fileName, e);
        }
    }

    public synchronized <T> T readObject(String fileName, Class<T> clazz, T fallback) {
        try {
            Path file = dataDir.resolve(fileName);
            if (Files.notExists(file)) {
                mapper.writeValue(file.toFile(), fallback);
                return fallback;
            }
            return mapper.readValue(file.toFile(), clazz);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao ler objeto JSON: " + fileName, e);
        }
    }

    public synchronized void writeList(String fileName, List<?> data) {
        try {
            mapper.writeValue(dataDir.resolve(fileName).toFile(), data);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar arquivo: " + fileName, e);
        }
    }

    public synchronized void writeObject(String fileName, Object data) {
        try {
            mapper.writeValue(dataDir.resolve(fileName).toFile(), data);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar objeto JSON: " + fileName, e);
        }
    }
}
