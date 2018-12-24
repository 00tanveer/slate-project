import React, { Component } from 'react';
import { Editor } from 'slate-react';
import { Value } from 'slate';

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            leaves: [
              {
                text: 'A line of text in a paragraph.',
              },
            ],
          },
        ],
      },
    ],
  },
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: initialValue
    }
  }
  onChange = ({ value }) => {
    this.setState({ value })
  }
  onKeyDown = (event, editor, next) => {
    event.preventDefault();
    if (event.shiftKey && event.key === 'Tab') {
      editor.insertText('and');
    }
    return true;
  }
  render() {
    return (
    <div>
      <Editor 
        value={this.state.value} 
        onChange={this.onChange} 
        onKeyDown={this.onKeyDown}/>
        <ul>
          <li>hey</li>
          <li>you</li>
          <ul>
            <li>my</li>
            <li>man</li>
            <ul>
              <li>fuck</li>
              <li>this</li>
              <li>shit</li>
            </ul>
          </ul>
        </ul>
      </div>
    );
  }
}

export default App;
