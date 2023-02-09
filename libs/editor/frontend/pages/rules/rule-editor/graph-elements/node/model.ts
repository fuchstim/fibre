import {
  NodeModel,
  NodeModelGenerics,
  DefaultPortModel,
  BasePositionModelOptions,
  DeserializeEvent
} from '@projectstorm/react-diagrams';

interface EditorNodeModelOptions extends BasePositionModelOptions {
  name?: string;
  color?: string;
}

interface EditorNodeModelGenerics extends NodeModelGenerics {
  OPTIONS: EditorNodeModelOptions;
}

export default class EditorNodeModel extends NodeModel<EditorNodeModelGenerics> {
  protected portsIn: DefaultPortModel[];
  protected portsOut: DefaultPortModel[];

  constructor(options: EditorNodeModelOptions) {
    super({
      type: 'default',
      name: 'Untitled',
      color: 'rgb(0,192,255)',
      ...options,
    });
    this.portsOut = [];
    this.portsIn = [];
  }

  doClone(lookupTable: object, clone: EditorNodeModel): void {
    clone.portsIn = [];
    clone.portsOut = [];
    super.doClone(lookupTable, clone);
  }

  removePort(port: DefaultPortModel): void {
    super.removePort(port);

    if (port.getOptions().in) {
      this.portsIn.splice(this.portsIn.indexOf(port), 1);
    } else {
      this.portsOut.splice(this.portsOut.indexOf(port), 1);
    }
  }

  addPort<T extends DefaultPortModel>(port: T): T {
    super.addPort(port);

    if (port.getOptions().in) {
      if (this.portsIn.indexOf(port) === -1) {
        this.portsIn.push(port);
      }
    } else {
      if (this.portsOut.indexOf(port) === -1) {
        this.portsOut.push(port);
      }
    }
    return port;
  }

  deserialize(event: DeserializeEvent<this>) {
    super.deserialize(event);
    this.options.name = event.data.name;
    this.options.color = event.data.color;
    this.portsIn = event.data.portsInOrder.map(
      (id: string) => this.getPortFromID(id) as DefaultPortModel
    );
    this.portsOut = event.data.portsOutOrder.map(
      (id: string) => this.getPortFromID(id) as DefaultPortModel
    );
  }

  serialize() {
    return {
      ...super.serialize(),
      name: this.options.name,
      color: this.options.color,
      portsInOrder: this.portsIn.map(p => p.getID()),
      portsOutOrder: this.portsOut.map(p => p.getID()),
    };
  }

  getInPorts(): DefaultPortModel[] {
    return this.portsIn;
  }

  getOutPorts(): DefaultPortModel[] {
    return this.portsOut;
  }
}
