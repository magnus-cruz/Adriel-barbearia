package com.barbearia.model;

public class Servico {
    private Long id;
    private String nome;
    private Double preco;
    private Integer duracaoMinutos;
    private Boolean ativo;

    public Servico() {
    }

    public Servico(Long id, String nome, Double preco, Integer duracaoMinutos, Boolean ativo) {
        this.id = id;
        this.nome = nome;
        this.preco = preco;
        this.duracaoMinutos = duracaoMinutos;
        this.ativo = ativo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Double getPreco() {
        return preco;
    }

    public void setPreco(Double preco) {
        this.preco = preco;
    }

    public Integer getDuracaoMinutos() {
        return duracaoMinutos;
    }

    public void setDuracaoMinutos(Integer duracaoMinutos) {
        this.duracaoMinutos = duracaoMinutos;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
