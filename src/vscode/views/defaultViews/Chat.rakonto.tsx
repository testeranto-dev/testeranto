import Story from 'rakonto/story.tsx';
import React from 'react';
import { Button } from './Button';

export default function ButtonStory() {
  return Story(
    <Button primary size="large">
      Click me
    </Button>
  );
}