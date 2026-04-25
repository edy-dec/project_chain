import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './index.css';

// After Auth0 callback, go to the root – App.jsx HomeRoute will
// redirect to /admin or /dashboard based on the synced role.
const onRedirectCallback = (appState) => {
  window.location.replace(appState?.returnTo || '/');
};

const auth0Config = {
  domain: process.env.REACT_APP_AUTH0_DOMAIN,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID,
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
};

const missingAuth0Vars = Object.entries({
  REACT_APP_AUTH0_DOMAIN: auth0Config.domain,
  REACT_APP_AUTH0_CLIENT_ID: auth0Config.clientId,
}).filter(([, value]) => !value);

const root = ReactDOM.createRoot(document.getElementById('root'));

if (missingAuth0Vars.length > 0) {
  const missingList = missingAuth0Vars.map(([key]) => key).join(', ');
  const message =
    `Missing frontend Auth0 config: ${missingList}. ` +
    'Create frontend/.env and restart the React dev server.';

  console.error(message);

  root.render(
    <React.StrictMode>
      <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
        <h1 style={{ marginTop: 0 }}>Configuratie Auth0 lipsa</h1>
        <p>{message}</p>
        <p>Exemplu minim in frontend/.env:</p>
        <pre
          style={{
            padding: '16px',
            overflow: 'auto',
            borderRadius: '8px',
            background: '#f5f5f5',
          }}
        >
{`REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_AUTH0_DOMAIN=chainapp.eu.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_AUTH0_AUDIENCE=https://chain-api`}
        </pre>
      </div>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <Auth0Provider
        domain={auth0Config.domain}
        clientId={auth0Config.clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: auth0Config.audience,
          scope: 'openid profile email',
        }}
        onRedirectCallback={onRedirectCallback}
        cacheLocation="localstorage"
      >
        <App />
      </Auth0Provider>
    </React.StrictMode>
  );
}
