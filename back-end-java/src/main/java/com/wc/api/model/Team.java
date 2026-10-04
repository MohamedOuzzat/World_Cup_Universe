package com.wc.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @NotBlank
    private String country;

    private String flagUrl;

    private Integer fifaRanking;

    public Team() {}

    public Team(String name, String country, String flagUrl, Integer fifaRanking) {
        this.name = name;
        this.country = country;
        this.flagUrl = flagUrl;
        this.fifaRanking = fifaRanking;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getFlagUrl() { return flagUrl; }
    public void setFlagUrl(String flagUrl) { this.flagUrl = flagUrl; }
    public Integer getFifaRanking() { return fifaRanking; }
    public void setFifaRanking(Integer fifaRanking) { this.fifaRanking = fifaRanking; }
}
