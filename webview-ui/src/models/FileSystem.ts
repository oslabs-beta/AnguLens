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
    public children: string[] = [],
    public router?: Router,
  ) {}
}
export interface Router {
  id: string;
  label: string,
  path: string;
  urlPath: string;
  children: Router[];
  inputs: any[]; // You can specify the correct type for the inputs
  outputs: any[]; // You can specify the correct type for the outputs
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
  hidden?: boolean;
  open?: boolean;
  onFolderClick?: () => void;
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
