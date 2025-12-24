import type { Meta, StoryObj } from '@storybook/react';
import { Button, Input, Modal, Avatar } from './Common';
import { useState } from 'react';

// ============================================
// BUTTON STORIES
// ============================================
const buttonMeta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default buttonMeta;
type ButtonStory = StoryObj<typeof Button>;

export const Primary: ButtonStory = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: ButtonStory = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    size: 'md',
  },
};

export const Danger: ButtonStory = {
  args: {
    children: 'Danger Button',
    variant: 'danger',
    size: 'md',
  },
};

export const Ghost: ButtonStory = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
    size: 'md',
  },
};

export const Small: ButtonStory = {
  args: {
    children: 'Small',
    variant: 'primary',
    size: 'sm',
  },
};

export const Large: ButtonStory = {
  args: {
    children: 'Large Button',
    variant: 'primary',
    size: 'lg',
  },
};

export const Disabled: ButtonStory = {
  args: {
    children: 'Disabled',
    variant: 'primary',
    disabled: true,
  },
};
