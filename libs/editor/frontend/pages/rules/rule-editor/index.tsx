import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Popconfirm, Row, Spin, notification } from 'antd';

import {
  CanvasWidget,
  DiagramEngine
} from '@projectstorm/react-diagrams';

import './_style.css';

import { createDiagramEngine, distributeNodes, exportRuleStages, fetchStages } from './_common';
import { CaretRightOutlined, PicCenterOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import AddNodeDrawer from '../../../components/add-node-drawer';
import Page from '../../../components/page';
import EditorNodeModel from './graph-elements/node/model';
import type { Types } from '@tripwire/engine';
import { TRuleStageWithNode } from './_types';
import client from '../../../common/client';
import { AxiosError } from 'axios';

export default function RuleEditor() {
  const [ loading, setLoading, ] = useState(false);
  const [ rule, setRule, ] = useState<Types.Config.TRuleConfig>();
  const [ showAddNodeDrawer, setShowAddNodeDrawer, ] = useState(false);
  const [ engine, setEngine, ] = useState<DiagramEngine>();

  const { ruleId, } = useParams();
  const navigate = useNavigate();

  useEffect(
    () => { getRule(); },
    []
  );

  const getRule = async () => {
    if (!ruleId) {
      return navigate('/rules');
    }

    setLoading(true);

    try {
      const rule = await client.getRule(ruleId);
      setRule(rule);

      await fetchStages(rule)
        .then(stages => createDiagramEngine(stages))
        .then(engine => setEngine(engine));
    } catch (error) {
      const { message, response, } = error as AxiosError;
      notification.error({ message, });

      if (response?.status === 404) {
        navigate('/rules');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentConfig = () => {
    if (!rule || !engine) { return; }

    const currentConfig: Types.Config.TRuleConfig = {
      id: rule.id,
      name: rule.name,
      stages: exportRuleStages(engine),
    };

    return currentConfig;
  };

  const saveAndReturn = async () => {
    const updatedConfig = getCurrentConfig();
    if (!updatedConfig) { return; }

    setLoading(true);

    await client.updateRule(updatedConfig)
      .then(() => navigate('/rules'))
      .catch(error => notification.error(error))
      .finally(() => setLoading(false));
  };

  const addNodeToGraph = (node: Types.Serializer.TSerializedNode) => {
    if (!engine) { return; }

    // TODO: Improve ID generation
    const highestIdNumber = Math.max(
      0,
      ...engine
        .getModel()
        .getNodes()
        .map(
          node => Number(node.getOptions().id?.split('stage-')?.[1] ?? '0')
        )
    );

    const ruleStage: TRuleStageWithNode = {
      id: `stage-${highestIdNumber + 1}`,
      nodeId: node.id,
      ruleId,
      node,
      inputs: [],
      nodeOptions: {},
    };

    const nodeModel = new EditorNodeModel({ ruleStage, });
    nodeModel.setPosition(
      50 + Math.random() * 300,
      50 + Math.random() * 150
    );

    engine.getModel().addNode(nodeModel);

    setTimeout(() => {
      engine.repaintCanvas();
    }, 100);
  };

  const getContent = () => {
    if (loading || !engine) {
      return (
        <Row style={{ height: '100%', }} justify="center" align="middle">
          <Col>
            <Spin spinning={loading} />
          </Col>
        </Row>
      );
    }

    return (
      <>
        <CanvasWidget className="editor-canvas" engine={engine} />
        <AddNodeDrawer
          ruleId={ruleId}
          open={showAddNodeDrawer}
          onSelected={node => addNodeToGraph(node)}
          onClose={() => setShowAddNodeDrawer(false)}
        />
      </>
    );
  };

  return (
    <Page
      title={rule?.name || 'Edit Rule'}
      subtitle="Add, remove, or change parts of this rule"
      headerExtra={(
        <Row gutter={16} wrap={false} justify="end" align="middle">
          <Col>
            <Button
              icon={<PlusOutlined/>}
              disabled={loading}
              onClick={() => setShowAddNodeDrawer(true)}
            />
          </Col>

          <Col>
            <Button
              icon={<CaretRightOutlined/>}
              disabled={loading}
              // onClick={() => setShowExecutionDrawer(true)}
            />
          </Col>

          <Col>
            <Button
              icon={<PicCenterOutlined />}
              disabled={loading}
              onClick={() => engine && distributeNodes(engine)}
            />
          </Col>

          <Col>
            <Popconfirm
              title="Discard changes"
              description="Unsaved progress will be lost. Continue?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => navigate('/rules')}
            >
              <Button disabled={loading}>
                Cancel
              </Button>
            </Popconfirm>
          </Col>

          <Col>
            <Button
              type='primary'
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => saveAndReturn()}
            >
              Save & Return
            </Button>
          </Col>
        </Row>
      )}
      content={getContent()}
    />
  );
}
