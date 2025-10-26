export interface UpdateHealthDto {
  healthProfile?: {
    alergias?: string[];
    condicoesCronicas?: string[];
    intoleranciasMedicamentos?: string[];
    alturaCm?: number;
    pesoKg?: number;
    obs?: string;
  };
  medTeam?: { medico?: { nome?: string; crm?: string; contato?: string } };
}