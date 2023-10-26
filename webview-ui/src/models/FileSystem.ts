import { DataSet } from 'vis-data';

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
    public router?: {
      name: string;
      path: string;
      children: RouterChildren[]; // Make sure children is an array of PcItem
    }
  ) {}
}

export interface DataStore {
  nodes: DataSet<any>;
  edges: DataSet<any>;
}

export class ServiceItem {
  constructor(
    public className: string,
    public fileName: string,
    public injectionPoints: InjectionPoint[],
    public path: string,
    public providedIn: string
  ) {}
}

export interface InjectionPoint {
  selectorName: string;
  folderPath: string;
}

export interface RouterChildren {
  name: string;
  children: RouterChildren[];
  inputs: Input[];
  outputs: Output[];
  path: string;
  urlPath: string;
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
  color?: string | {};
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
  label?: string;
  font?: object;
}
//
