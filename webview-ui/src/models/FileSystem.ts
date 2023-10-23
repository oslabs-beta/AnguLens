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
    public inputs: Input[] = [],
    public outputs: Output[] = [],
    public children: string[] = []
  ) {}
}

export interface Input {
  name: string;
  pathTo: string;
  pathFrom: string;
}

export interface Output {
  name: string;
  pathTo: string;
  pathFrom: string;
}
export interface Node {
  id: string;
  label: string;
  image?: {
    unselected?: string;
    selected?: string;
  };
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  color?: {};
  relation?: string;
  endPointOffset?: {
    to: number;
    from: number;
  };
  arrowStrikethrough?: boolean;
  smooth?: { type: string; roundness: number } | boolean;
  arrows?: {
    to: object;
    middle?: object;
    from?: object;
  };
  group?: object;
}
//
