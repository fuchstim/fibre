import {
  AbstractModelFactory,
  DiagramEngine,
  GenerateModelEvent
} from '@projectstorm/react-diagrams';

import EditorPortModel from './model';

export default class EditorPortFactory extends AbstractModelFactory<EditorPortModel, DiagramEngine> {
  constructor() {
    super('editor-port');
  }

  generateModel(event: GenerateModelEvent): EditorPortModel {
    return new EditorPortModel(event.initialConfig);
  }
}
