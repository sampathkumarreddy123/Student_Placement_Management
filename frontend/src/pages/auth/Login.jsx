import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'College email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      const data = await login({ email: email.trim(), password });
      setSuccess(`Authentication successful! Redirecting to ${data.user.role} dashboard...`);

      const targetRole = data.user.role;
      const destination =
        location.state?.from?.pathname ||
        (targetRole === 'officer' ? '/officer/dashboard' : '/student/dashboard');

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);
    } catch (err) {
      setError(
        err.message || 'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'officer') {
      setEmail('officer@college.edu');
      setPassword('password123');
    } else {
      setEmail('student@college.edu');
      setPassword('password123');
    }
    setError('');
    setFieldErrors({});
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Common portal login for both Students and Placement Officers
        </p>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
          className="mb-4"
        />
      )}

      {success && (
        <Alert
          type="success"
          message={success}
          className="mb-4"
        />
      )}

      {/* Demo Quick-Fill Buttons */}
      <div className="mb-5 p-3 bg-blue-50/70 border border-blue-100 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-blue-900">
            One-Click Test Accounts:
          </p>
          <span className="text-[10px] text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
            Pre-Seeded
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemo('officer')}
            className="py-1.5 px-2 bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-medium transition-colors text-center"
          >
            Placement Officer
          </button>
          <button
            type="button"
            onClick={() => fillDemo('student')}
            className="py-1.5 px-2 bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 rounded text-xs font-medium transition-colors text-center"
          >
            Eligible Student
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="College Email Address"
          id="email"
          name="email"
          type="email"
          placeholder="your.email@college.edu"
          icon={Mail}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
          }}
          error={fieldErrors.email}
          required
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          icon={Lock}
          showPasswordToggle
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
          }}
          error={fieldErrors.password}
          required
        />

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={loading}
          icon={LogIn}
        >
          {loading ? 'Authenticating...' : 'Sign In to Portal'}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          New student?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            Create Student Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
