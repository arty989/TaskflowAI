import type { Meta, StoryObj } from '@storybook/react';
import { Modal, Button, Input } from './Common';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Modal Title',
    children: <p>This is the modal content. You can put any content here.</p>,
    onClose: () => console.log('Close clicked'),
  },
};

export const WithForm: Story = {
  args: {
    isOpen: true,
    title: 'Create New Task',
    onClose: () => console.log('Close clicked'),
    children: (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Task Title</label>
          <Input placeholder="Enter task title..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input placeholder="Enter description..." />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>
      </div>
    ),
  },
};

export const Confirmation: Story = {
  args: {
    isOpen: true,
    title: 'Confirm Delete',
    onClose: () => console.log('Close clicked'),
    children: (
      <div className="space-y-4">
        <p className="text-gray-600">Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary">Cancel</Button>
          <Button variant="danger">Delete</Button>
        </div>
      </div>
    ),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    title: 'Hidden Modal',
    children: <p>You should not see this.</p>,
    onClose: () => console.log('Close clicked'),
  },
};
