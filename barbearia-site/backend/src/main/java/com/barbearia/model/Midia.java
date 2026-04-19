package com.barbearia.model;

public class Midia {
    private String id;
    private String nomeArquivo;
    private String tipo;
    private String categoria;
    private String titulo;
    private String url;
    private Long tamanhoKb;
    private String dataUpload;

    public Midia() {
    }

    public Midia(String id, String nomeArquivo, String tipo, String categoria, String titulo, String url, Long tamanhoKb, String dataUpload) {
        this.id = id;
        this.nomeArquivo = nomeArquivo;
        this.tipo = tipo;
        this.categoria = categoria;
        this.titulo = titulo;
        this.url = url;
        this.tamanhoKb = tamanhoKb;
        this.dataUpload = dataUpload;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNomeArquivo() {
        return nomeArquivo;
    }

    public void setNomeArquivo(String nomeArquivo) {
        this.nomeArquivo = nomeArquivo;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Long getTamanhoKb() {
        return tamanhoKb;
    }

    public void setTamanhoKb(Long tamanhoKb) {
        this.tamanhoKb = tamanhoKb;
    }

    public String getDataUpload() {
        return dataUpload;
    }

    public void setDataUpload(String dataUpload) {
        this.dataUpload = dataUpload;
    }
}
