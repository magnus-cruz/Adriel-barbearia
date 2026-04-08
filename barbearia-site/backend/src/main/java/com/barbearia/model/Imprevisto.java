package com.barbearia.model;

public class Imprevisto {
    private Long id;
    private String data;
    private String periodo;
    private String motivo;

    public Imprevisto() {
    }

    public Imprevisto(Long id, String data, String periodo, String motivo) {
        this.id = id;
        this.data = data;
        this.periodo = periodo;
        this.motivo = motivo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public String getPeriodo() {
        return periodo;
    }

    public void setPeriodo(String periodo) {
        this.periodo = periodo;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
