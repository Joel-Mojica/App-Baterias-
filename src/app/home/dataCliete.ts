

export interface BateriasDistribuidor{
    id: number,
    descripcion: string
}


export interface comparacionBaterias{
    id: number,
    serie: number,
    descripcion: string,
    no_factu: number,
    fecha: string
}


export interface QueryAPi{
    queryIn: string,
    mode : string
}