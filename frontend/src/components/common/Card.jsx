import React from 'react';
import { classNames } from '../../utils/formatters';
import './Card.css';

const Card = ({ children, className = '', padding = true, ...rest }) => (
  <div className={classNames('card', !padding && 'card-no-pad', className)} {...rest}>
    {children}
  </div>
);

Card.Header = ({ children, className = '' }) => <div className={classNames('card-header', className)}>{children}</div>;
Card.Body   = ({ children, className = '' }) => <div className={classNames('card-body',   className)}>{children}</div>;
Card.Footer = ({ children, className = '' }) => <div className={classNames('card-footer', className)}>{children}</div>;

export default Card;
