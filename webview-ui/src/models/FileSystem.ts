export class FsItem {
  constructor(
    public id: string,
    public label: string,
    public type: string,
    public folderParent?: string,
    public children: string[] = []
  ) {}
}
