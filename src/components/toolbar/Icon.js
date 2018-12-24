import React from 'react';
import styled from 'styled-components';

export const Icon = styled(({ className, ...rest }) => {
  return <span className={`material-icons ${className}`} {...rest} />
})`
  font-size: 18px;
  vertical-align: text-bottom;
`