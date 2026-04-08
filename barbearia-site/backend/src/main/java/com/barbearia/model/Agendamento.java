package com.barbearia.model;

public class Agendamento {
    private Long id;
    private String nome;
    private String telefone;
    private String servico;
    private String data;
    private String horario;
    private String status;

    public Agendamento() {
    }

    public Agendamento(Long id, String nome, String telefone, String servico, String data, String horario, String status) {
        this.id = id;
        this.nome = nome;
        this.telefone = telefone;
        this.servico = servico;
        this.data = data;
        this.horario = horario;
        this.status = status;
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

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getServico() {
        return servico;
    }

    public void setServico(String servico) {
        this.servico = servico;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public String getHorario() {
        return horario;
    }

    public void setHorario(String horario) {
        this.horario = horario;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
