package com.barbearia.service;

import com.barbearia.model.Curso;
import com.barbearia.model.Midia;
import com.barbearia.model.Servico;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class CatalogoService {

    private final JsonDataStore jsonDataStore;

    public CatalogoService(JsonDataStore jsonDataStore) {
        this.jsonDataStore = jsonDataStore;
    }

    public List<Servico> listarServicos() {
        return jsonDataStore.readList("servicos.json", new TypeReference<>() {
        });
    }

    public Servico salvarServico(Servico servico) {
        List<Servico> servicos = listarServicos();
        long nextId = servicos.stream().map(Servico::getId).filter(id -> id != null).max(Long::compareTo).orElse(0L) + 1;
        servico.setId(nextId);
        servicos.add(servico);
        jsonDataStore.writeList("servicos.json", servicos);
        return servico;
    }

    public Servico atualizarServico(Long id, Servico atualizado) {
        List<Servico> servicos = listarServicos();
        for (Servico s : servicos) {
            if (s.getId().equals(id)) {
                s.setNome(atualizado.getNome());
                s.setPreco(atualizado.getPreco());
                s.setDuracaoMinutos(atualizado.getDuracaoMinutos());
                s.setAtivo(atualizado.getAtivo());
                jsonDataStore.writeList("servicos.json", servicos);
                return s;
            }
        }
        throw new IllegalArgumentException("Servico nao encontrado");
    }

    public void excluirServico(Long id) {
        List<Servico> servicos = listarServicos();
        servicos.removeIf(s -> s.getId().equals(id));
        jsonDataStore.writeList("servicos.json", servicos);
    }

    public List<Curso> listarCursos() {
        return jsonDataStore.readList("cursos.json", new TypeReference<>() {
        });
    }

    public Curso salvarCurso(Curso curso) {
        List<Curso> cursos = listarCursos();
        long nextId = cursos.stream().map(Curso::getId).filter(id -> id != null).max(Long::compareTo).orElse(0L) + 1;
        curso.setId(nextId);
        cursos.add(curso);
        jsonDataStore.writeList("cursos.json", cursos);
        return curso;
    }

    public Curso atualizarCurso(Long id, Curso atualizado) {
        List<Curso> cursos = listarCursos();
        for (Curso c : cursos) {
            if (c.getId().equals(id)) {
                c.setTitulo(atualizado.getTitulo());
                c.setDescricao(atualizado.getDescricao());
                c.setPreco(atualizado.getPreco());
                c.setCargaHoraria(atualizado.getCargaHoraria());
                c.setImagemUrl(atualizado.getImagemUrl());
                c.setLinkCompra(atualizado.getLinkCompra());
                jsonDataStore.writeList("cursos.json", cursos);
                return c;
            }
        }
        throw new IllegalArgumentException("Curso nao encontrado");
    }

    public void excluirCurso(Long id) {
        List<Curso> cursos = listarCursos();
        cursos.removeIf(c -> c.getId().equals(id));
        jsonDataStore.writeList("cursos.json", cursos);
    }

    public List<Midia> listarMidias() {
        return jsonDataStore.readList("midia-metadata.json", new TypeReference<>() {
        });
    }

    public Midia salvarMidia(Midia midia) {
        List<Midia> midias = listarMidias();
        midia.setId(UUID.randomUUID().toString());
        midias.add(midia);
        jsonDataStore.writeList("midia-metadata.json", midias);
        return midia;
    }

    public void excluirMidia(String id) {
        List<Midia> midias = listarMidias();
        midias.removeIf(m -> Objects.equals(m.getId(), id));
        jsonDataStore.writeList("midia-metadata.json", midias);
    }

    public void excluirMidiaPorNomeArquivo(String nomeArquivo) {
        List<Midia> midias = listarMidias();
        midias.removeIf(midia -> {
            String arquivo = midia.getNomeArquivo();
            if (arquivo != null && !arquivo.isBlank()) {
                return arquivo.equals(nomeArquivo);
            }
            String url = midia.getUrl();
            return url != null && !url.isBlank() && (url.endsWith("/" + nomeArquivo) || url.endsWith(nomeArquivo));
        });
        jsonDataStore.writeList("midia-metadata.json", midias);
    }
}
