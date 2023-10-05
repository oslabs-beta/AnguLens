export class Node {
  constructor(
    public id: string,
    public label: string,
    public meta: object,
    public dimension: object,
    public position: object
  ) {}
}

export class Link {
  constructor(
    public id: string,
    public source: string,
    public target: string,
    public label: string
  ) {}
}
