import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Common';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    name: 'Jane Smith',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    name: 'Bob Wilson',
    size: 'lg',
  },
};

export const WithImage: Story = {
  args: {
    name: 'User',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    size: 'md',
  },
};

export const SingleLetter: Story = {
  args: {
    name: 'A',
    size: 'md',
  },
};
