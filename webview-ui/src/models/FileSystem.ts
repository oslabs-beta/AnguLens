export class FsItem {
  constructor(
    public id: string,
    public label: string,
    public type: string,
    public folderParent?: string,
    public children: string[] = []
  ) {}
}

export class PcItem {
  constructor(
    public id: string,
    public label: string,
    public type: string,
    public inputs: string[] = [],
    public outputs: string[] = [],
    public children: string[] = []
  ) {}
}

export interface Node {
  id: string;
  label: string;
  image: {
    unselected: string;
    selected: string;
  };
}

export interface Edge {
  id: string;
  from: string;
  to: string;
}
