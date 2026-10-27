import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { getProfile, updateProfile } from '../api/profile-api';
import type { ResponseStyle } from '../types/profile-api-types';
import { formatDateKey } from '../utils/calendar-utils';

const RESPONSE_STYLE_KEYS: Record<ResponseStyle, string> = {
  concise: 'profileResponseStyleConcise',
  balanced: 'profileResponseStyleBalanced',
  detailed: 'profileResponseStyleDetailed',
};

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profession, setProfession] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [responseStyle, setResponseStyle] =
    useState<ResponseStyle>('balanced');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const result = await getProfile();

        if (!active) return;

        setProfession(result.profession ?? '');
        setInterests(result.interests);
        setResponseStyle(result.responseStyle);
      } catch {
        if (active) {
          setError(t('profileLoadError'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [t]);

  function handleResponseStyleChange(event: SelectChangeEvent) {
    setResponseStyle(event.target.value as ResponseStyle);
    setSuccess(false);
  }

  function addInterest() {
    const value = interestInput.trim();

    if (!value) return;

    if (value.length > 50) {
      setError(t('profileInterestLengthError'));
      return;
    }

    if (
      interests.some(
        (interest) => interest.toLowerCase() === value.toLowerCase(),
      )
    ) {
      setInterestInput('');
      return;
    }

    if (interests.length >= 20) {
      setError(t('profileMaxInterestsError'));
      return;
    }

    setInterests((current) => [...current, value]);
    setInterestInput('');
    setError('');
    setSuccess(false);
  }

  function removeInterest(value: string) {
    setInterests((current) =>
      current.filter((interest) => interest !== value),
    );
    setSuccess(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess(false);

    const trimmedProfession = profession.trim();

    if (trimmedProfession.length > 100) {
      setError(t('profileProfessionLengthError'));
      return;
    }

    setSaving(true);

    try {
      const updated = await updateProfile({
        profession: trimmedProfession || null,
        interests,
        responseStyle,
      });

      setProfession(updated.profession ?? '');
      setInterests(updated.interests);
      setResponseStyle(updated.responseStyle);
      setSuccess(true);
    } catch {
      setError(t('profileSaveError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Stack
        role="status"
        aria-label={t('profileLoading')}
        alignItems="center"
        spacing={2}
        py={8}
      >
        <CircularProgress />
        <Typography color="text.secondary">{t('profileLoading')}</Typography>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 720,
        mx: 'auto',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Stack spacing={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() =>
            navigate(`/calendar/month/${formatDateKey(new Date())}`)
          }
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          {t('backToCalendar')}
        </Button>

        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {t('profileTitle')}
          </Typography>
          <Typography color="text.secondary">
            {t('profileDescription')}
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {success && (
          <Alert severity="success">{t('profileSaved')}</Alert>
        )}

        <Paper
          component="form"
          onSubmit={handleSubmit}
          elevation={0}
          variant="outlined"
          sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t('authEmail')}
              </Typography>
              <Typography sx={{ overflowWrap: 'anywhere' }}>
                {user?.email}
              </Typography>
            </Box>

            <TextField
              label={t('profileProfession')}
              value={profession}
              onChange={(event) => {
                setProfession(event.target.value);
                setSuccess(false);
              }}
              placeholder={t('profileProfessionPlaceholder')}
              inputProps={{ maxLength: 100 }}
              helperText={t('profileProfessionHelper')}
              fullWidth
            />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                {t('profileInterests')}
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
              >
                <TextField
                  value={interestInput}
                  onChange={(event) => setInterestInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addInterest();
                    }
                  }}
                  label={t('profileAddInterest')}
                  placeholder={t('profileInterestPlaceholder')}
                  inputProps={{ maxLength: 50 }}
                  fullWidth
                />

                <Button
                  variant="outlined"
                  onClick={addInterest}
                  disabled={!interestInput.trim()}
                >
                  {t('profileAdd')}
                </Button>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                mt={2}
              >
                {interests.map((interest) => (
                  <Chip
                    key={interest}
                    label={interest}
                    onDelete={() => removeInterest(interest)}
                  />
                ))}
              </Stack>

              {interests.length === 0 && (
                <Typography color="text.secondary" variant="body2" mt={1}>
                  {t('profileNoInterests')}
                </Typography>
              )}
            </Box>

            <FormControl fullWidth>
              <InputLabel id="response-style-label">
                {t('profileResponseStyle')}
              </InputLabel>
              <Select
                labelId="response-style-label"
                value={responseStyle}
                label={t('profileResponseStyle')}
                onChange={handleResponseStyleChange}
              >
                {Object.entries(RESPONSE_STYLE_KEYS).map(
                  ([value, labelKey]) => (
                    <MenuItem key={value} value={value}>
                      {t(labelKey)}
                    </MenuItem>
                  ),
                )}
              </Select>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {t('profileResponseStyleHelper')}
              </Typography>
            </FormControl>

            <Box display="flex" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={
                  saving ? <CircularProgress size={18} /> : undefined
                }
              >
                {saving ? t('profileSaving') : t('profileSaveChanges')}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}