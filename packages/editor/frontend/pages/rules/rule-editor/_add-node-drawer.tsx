import React, { useState } from 'react';
import { Button, Drawer, Table, notification } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import client from '../../../common/client';
import type { Types } from '@fibrejs/engine';
import { ColumnsType } from 'antd/es/table';

type Props = {
  ruleId?: string,
  open: boolean
  onSelected: (node: Types.Serializer.TSerializedNode) => void;
  onClose: () => void;
};

export default function AddNodeDrawer({ ruleId, open, onSelected, onClose, }: Props) {
  const [ loading, setLoading, ] = useState(true);
  const [ nodes, setNodes, ] = useState<Types.Serializer.TSerializedNode[]>([]);

  const fetchNodes = async () => {
    setLoading(true);

    await client.findNodes({ ruleId, })
      .then(nodes => setNodes(nodes))
      .catch(e => notification.error({ message: e.message, }))
      .finally(() => setLoading(false));
  };

  const columns: ColumnsType<Types.Serializer.TSerializedNode> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      key: 'edit',
      render: (_, record) => (
        <Button
          icon={<PlusOutlined />}
          onClick={() => { onSelected(record); onClose(); }}
        >
          Add to Rule
        </Button>
      ),
    },
  ];

  return (
    <Drawer
      title="Add Node"
      placement="right"
      closable={true}
      onClose={onClose}
      afterOpenChange={fetchNodes}
      open={open}
      size="large"
    >
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={nodes}
      />
    </Drawer>
  );
}
