package com.barbearia.model;

public class Midia {
    private Long id;
    private String tipo;
    private String categoria;
    private String titulo;
    private String url;

    public Midia() {
    }

    public Midia(Long id, String tipo, String categoria, String titulo, String url) {
        this.id = id;
        this.tipo = tipo;
        this.categoria = categoria;
        this.titulo = titulo;
        this.url = url;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
}
