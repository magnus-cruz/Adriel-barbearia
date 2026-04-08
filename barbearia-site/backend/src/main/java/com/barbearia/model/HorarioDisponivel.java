package com.barbearia.model;

import java.util.Map;

public class HorarioDisponivel {

    private Configuracao configuracao;

    public HorarioDisponivel() {
    }

    public Configuracao getConfiguracao() {
        return configuracao;
    }

    public void setConfiguracao(Configuracao configuracao) {
        this.configuracao = configuracao;
    }

    public static class Configuracao {
        private Integer intervaloPadrao;
        private Map<String, DiaSemanaConfig> diasSemana;

        public Configuracao() {
        }

        public Integer getIntervaloPadrao() {
            return intervaloPadrao;
        }

        public void setIntervaloPadrao(Integer intervaloPadrao) {
            this.intervaloPadrao = intervaloPadrao;
        }

        public Map<String, DiaSemanaConfig> getDiasSemana() {
            return diasSemana;
        }

        public void setDiasSemana(Map<String, DiaSemanaConfig> diasSemana) {
            this.diasSemana = diasSemana;
        }
    }

    public static class DiaSemanaConfig {
        private String inicio;
        private String fim;
        private Boolean ativo;

        public DiaSemanaConfig() {
        }

        public String getInicio() {
            return inicio;
        }

        public void setInicio(String inicio) {
            this.inicio = inicio;
        }

        public String getFim() {
            return fim;
        }

        public void setFim(String fim) {
            this.fim = fim;
        }

        public Boolean getAtivo() {
            return ativo;
        }

        public void setAtivo(Boolean ativo) {
            this.ativo = ativo;
        }
    }
}
