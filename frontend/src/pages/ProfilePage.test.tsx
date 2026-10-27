import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '../config/i18n';
import { getProfile, updateProfile } from '../api/profile-api';
import type { UserProfile } from '../types/profile-api-types';
import { formatDateKey } from '../utils/calendar-utils';
import ProfilePage from './ProfilePage';

vi.mock('../api/profile-api', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('../auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'internal-user-id', email: 'user@example.com' },
  }),
}));

const profile: UserProfile = {
  userId: 'internal-user-id',
  profession: 'Engineer',
  interests: ['Design'],
  responseStyle: 'balanced',
  createdAt: null,
  updatedAt: null,
};

function CalendarRoute() {
  const { view, date } = useParams();
  return <output>{`calendar:${view}:${date}`}</output>;
}

function renderProfilePage() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/calendar/:view/:date"
          element={<CalendarRoute />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProfile).mockResolvedValue(profile);
    vi.mocked(updateProfile).mockImplementation(async (data) => ({
      ...profile,
      ...data,
    }));
  });

  it('loads the profile and shows the email instead of the internal user ID', async () => {
    renderProfilePage();

    expect(await screen.findByDisplayValue('Engineer')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.queryByText('internal-user-id')).not.toBeInTheDocument();
    expect(getProfile).toHaveBeenCalledOnce();
  });

  it('saves edited profile fields and displays the success message', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    await user.clear(await screen.findByRole('textbox', { name: 'Profession' }));
    await user.type(
      screen.getByRole('textbox', { name: 'Profession' }),
      'Developer',
    );
    await user.type(
      screen.getByRole('textbox', { name: 'Add interest' }),
      'AI',
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Response style' }));
    await user.click(await screen.findByRole('option', { name: 'Detailed' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        profession: 'Developer',
        interests: ['Design', 'AI'],
        responseStyle: 'detailed',
      });
    });
    expect(await screen.findByText('Profile saved successfully.')).toBeInTheDocument();
  });

  it('returns to the existing calendar route when opened directly', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    await user.click(
      await screen.findByRole('button', { name: 'Back to Calendar' }),
    );

    expect(
      await screen.findByText(`calendar:month:${formatDateKey(new Date())}`),
    ).toBeInTheDocument();
  });
});
