export class Node {
  constructor(
    public id: string,
    public label: string,
    public meta: { forceDimensions: boolean },
    public dimension: { width: number; height: number },
    public position: { x: number; y: number }
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

export class Cluster {
  constructor(
    public id: string,
    public label: string,
    public childNodeIds: string[],
    public meta: { forceDimensions: boolean },
    public dimension: { width: number; height: number },
    public position: { x: number; y: number }
  ) {}
}

// childNodeIds
// :
// (2) ['c1', 'c2']
// data
// :
// {color: '#8796c0'}
// dimension
// :
// {width: 30, height: 30}
// height
// :
// 450
// id
// :
// "third"
// label
// :
// "Cluster node"
// meta
// :
// {forceDimensions: false}
// position
// :
// {x: 0, y: 0}
// width
// :
// 188.875
// x
// :
// 246
// y
// :
// 360
