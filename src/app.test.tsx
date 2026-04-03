import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import App from './App';

describe('WildcatLedger App', () => {
  test('renders the app header with app name', () => {
    render(<App />);
    expect(screen.getByText('WildcatLedger')).toBeInTheDocument();
  });

  test('renders the org badge in the header', () => {
    render(<App />);
    expect(screen.getByText('ColorStack NU')).toBeInTheDocument();
  });

  test('renders the Add Transaction button in the header', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  test('renders all four budget line cards', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /asg/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /operating/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gifts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /debit card/i })).toBeInTheDocument();
  });

  test('renders progress bar summary labels', () => {
    render(<App />);
    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('Total Inflow')).toBeInTheDocument();
    expect(screen.getByText('Total Outflow')).toBeInTheDocument();
  });

  test('renders the incomplete transactions card', () => {
    render(<App />);
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByText('transactions need attention')).toBeInTheDocument();
  });

  test('renders the recent activity feed heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Recent Activity' })).toBeInTheDocument();
  });

  test('renders the view all transactions button', () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: /view all transactions/i }),
    ).toBeInTheDocument();
  });

  test('renders filter buttons', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Inflow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outflow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flagged' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submitted' })).toBeInTheDocument();
  });

  test('renders mock transactions in the table', () => {
    render(<App />);
    expect(screen.getAllByText('Spring Hackathon Fundraiser').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ASG Spring Allocation').length).toBeGreaterThan(0);
  });

  test('modal is not visible on initial render', () => {
    render(<App />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('clicking Add Transaction opens the modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Add Transaction' })).toBeInTheDocument();
  });

  test('closing the modal removes it from the document', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close modal/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('can add a new transaction via modal and it closes on success', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await user.type(screen.getByLabelText(/title \/ description/i), 'Test Grant');
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '250');
    await user.type(screen.getByLabelText(/person responsible/i), 'Alex Rivera');

    await user.click(screen.getByRole('button', { name: 'Add Transaction' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByText('Test Grant').length).toBeGreaterThan(0);
  });

  test('shows validation error when title is missing', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /\+ add transaction/i }));
    await user.click(screen.getByRole('button', { name: 'Add Transaction' }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Title is required.')).toBeInTheDocument();
  });

  test('filters transactions by budget line when card is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    const asgCard = screen.getByRole('button', { name: /asg/i });
    await user.click(asgCard);

    expect(asgCard).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Clear filter ×')).toBeInTheDocument();
  });

  test('clears budget line filter when Clear filter is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /asg/i }));
    await user.click(screen.getByText('Clear filter ×'));

    expect(screen.queryByText('Clear filter ×')).not.toBeInTheDocument();
  });
});
