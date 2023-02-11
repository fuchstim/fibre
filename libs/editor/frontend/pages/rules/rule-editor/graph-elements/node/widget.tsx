import React, { useEffect, useState } from 'react';
import { DiagramEngine } from '@projectstorm/react-diagrams';
import { Card, Checkbox, Col, Divider, Form, Input, InputNumber, Row, Select, theme } from 'antd';

// TODO: Fix imports without requiring winston
import * as Types from '@tripwire/engine/dist/types';
import * as WrappedTypes from '@tripwire/engine/dist/common/wrapped-types';

import EditorNodeModel from './model';
import EditorPortModel, { EPortType } from '../port/model';
import EditorPortWidget from '../port/widget';

interface EditorNodeProps {
  editorNode: EditorNodeModel;
  engine: DiagramEngine;
}

export default function EditorNodeWidget(props: EditorNodeProps) {
  const [ , updateState, ] = useState<object | undefined>();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const [ portFoldLevels, setPortFoldLevels, ] = useState<Types.Common.TKeyValue<EPortType, number>>({
    [EPortType.INPUT]: 0,
    [EPortType.OUTPUT]: 0,
  });

  useEffect(
    () => props.editorNode.registerListener({ nodeReloaded: forceUpdate, }).deregister,
    []
  );

  const ruleStage = props.editorNode.getOptions().ruleStage;
  const isSelected = props.editorNode.isSelected();

  const {
    token: { colorPrimary, },
  } = theme.useToken();

  const createPort = (port: EditorPortModel) => {
    const { level, portType, config, } = port.getOptions();
    const portFoldLevel = portFoldLevels[portType];

    const toggleFold = () => setPortFoldLevels({
      ...portFoldLevels,
      [portType]: portFoldLevel > level ? level : (level + 1),
    });

    return (
      <EditorPortWidget
        engine={props.engine}
        port={port}
        key={port.getID()}
        onClick={config.type.isComplex ? () => toggleFold() : undefined}
        hideIfUnlinked={level > portFoldLevel}
      />
    );
  };

  const createInput = (name: string, inputOptions?: Types.Node.TNodeMetadataInputOptions) => {
    const type = inputOptions?.type ?? WrappedTypes.EPrimitive.STRING;

    const input = {
      [WrappedTypes.EPrimitive.NUMBER]: {
        valuePropName: 'value',
        element: (<InputNumber placeholder={name} style={{ width: '100%', }} />),
      },
      [WrappedTypes.EPrimitive.BOOLEAN]: {
        valuePropName: 'checked',
        element: (<Checkbox style={{ width: '100%', }}>{name}</Checkbox>),
      },
      [WrappedTypes.EPrimitive.STRING]: {
        valuePropName: 'value',
        element: (<Input placeholder={name} style={{ width: '100%', }} />),
      },
    };

    return input[type] ?? input[WrappedTypes.EPrimitive.STRING];
  };

  const createDropDownInput = (name: string, dropDownOptions: Types.Node.TNodeMetadataDropDownOption[] = []) => {
    const options = dropDownOptions.map(
      ({ id, name, }) => (<Select.Option key={id} value={id}>{name}</Select.Option>)
    );

    return {
      valuePropName: 'value',
      element: (<Select placeholder={name} style={{ width: '100%', }}>{options}</Select>),
    };
  };

  const createFormItem = (nodeOption: Types.Serializer.TSerializedNodeOption) => {
    const { id, type, name, } = nodeOption;

    let input: { valuePropName: string, element: JSX.Element } | undefined;

    switch (type) {
      case Types.Node.ENodeMetadataOptionType.INPUT:
        input = createInput(name, nodeOption.inputOptions);
        break;
      case Types.Node.ENodeMetadataOptionType.DROP_DOWN:
        input = createDropDownInput(name, nodeOption.dropDownOptions);
        break;

    }

    if (!input) { return; }

    return (
      <Form.Item
        key={id}
        name={id}
        style={{ marginBottom: 6, width: '100%', }}
        valuePropName={input.valuePropName}
      >
        { input.element }
      </Form.Item>
    );
  };

  const options = (
    <div>
      <Divider orientation='left' plain style={{ marginTop: 0, }}>
        Options
      </Divider>

      <Form
        size='small'
        layout='vertical'
        initialValues={ruleStage.nodeOptions ?? {}}
        style={{ padding: '0 24px 24px 24px', width: '190px', }}
        onValuesChange={(_, updatedOptions) => props.editorNode.fireEvent({ updatedOptions, }, 'optionsUpdated')}
      >
        {ruleStage.node.options.map(option => createFormItem(option))}
      </Form>

    </div>
  );

  return (
    <Card
      title={ruleStage.node.name}
      bordered={false}
      bodyStyle={{ padding: 0, }}
      hoverable={true}
      style={isSelected ? { boxShadow: `${colorPrimary} 0px 0px 4px`, } : {}}
    >
      <Row justify="space-between" gutter={16} style={{ padding: '6px 0', }}>
        <Col>{props.editorNode.getInputPorts().map(port => createPort(port))}</Col>
        <Col>{props.editorNode.getOutputPorts().map(port => createPort(port))}</Col>
      </Row>

      { ruleStage.node.options.length ? options : (<></>) }
    </Card>
  );
}
