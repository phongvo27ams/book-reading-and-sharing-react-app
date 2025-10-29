import { vi } from "vitest";
import { useEffect } from "react";
import { MemoryRouter } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import SigninPage from "../SigninPage";
import { Messages } from "../../../components/FoxCharacter/FoxCharacter";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

let mockUserRegister = vi.fn();
let mockSetMessage = vi.fn();

// Mock useAuth
vi.mock("../../../provider/AuthContext", () => ({
  useAuth: () => ({
    userRegister: mockUserRegister,
    loading: false,
    setMessage: mockSetMessage,
  }),
}));

vi.mock("../../assets/fox.png", () => "fox.png");

vi.mock("../../../components/FloatingHintTextBox/FloatingHintTextBox.", () => {
  return {
    default: ({ hint, value, onChange, ...props }) => (
      <input
        aria-label={hint}
        value={value}
        onChange={(e) => onChange && onChange(e)}
        {...props}
      />
    ),
  };
});

vi.mock('../../../components/PasswordReqList', () => {
  return {
    default: ({ onValidityChange }) => {
      useEffect(() => {
        onValidityChange(true);
      }, []);
      return <div>PasswordReqList mock</div>;
    },
  };
});

// ==== Helper Functions ====
const renderSigninPage = () =>
  render(
    <MemoryRouter>
      <SigninPage />
    </MemoryRouter>
  );

const fillStep1 = () => {
  fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "user001" } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "John" } });
  fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Doe" } });
  fireEvent.click(screen.getByText(/Go to next step/i));
};

describe("Component SigninPage: Initial Content Rendering", () => {
  beforeEach(() => vi.clearAllMocks());

  test("SHOULD render the logo, main title, and initial link WHEN the component loads", () => {
    renderSigninPage();

    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.getByText("SIGN UP")).toBeInTheDocument();

    // Step 1 inputs
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();

    // Step 2 inputs
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-input")).toBeInTheDocument();

    // Buttons
    expect(screen.getByText(/Go to next step/i)).toBeInTheDocument();
    expect(screen.getByText(/Join the Foxes/i)).toBeInTheDocument();

    // Link
    expect(screen.getByText(/Are you a Fox/i)).toBeInTheDocument();
  });
});

describe("Component SigninPage: Step 1 Form Validation and Navigation", () => {
  beforeEach(() => vi.clearAllMocks());

  test("SHOULD call the BLANK message handler WHEN the user clicks 'Go to next step' with empty fields", async () => {
    renderSigninPage();

    fireEvent.click(screen.getByText(/Go to next step/i));

    await waitFor(() => {
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
    });
  });

  test("SHOULD call the INVALID_EMAIL message handler WHEN other fields are valid but the email format is incorrect", async () => {
    renderSigninPage();

    fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: "user001" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "invalid-email" } });
    fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Doe" } });

    mockSetMessage.mockClear(); // Reset all other calls
    fireEvent.click(screen.getByText(/Go to next step/i));

    await waitFor(() => {
      const calledWithInvalidEmail = mockSetMessage.mock.calls.some(
        call => JSON.stringify(call[0]) === JSON.stringify(Messages.INVALID_EMAIL)
      );
      expect(calledWithInvalidEmail).toBe(true);
    });
  });

  test("SHOULD proceed to Step 2 AND show the password fields WHEN all Step 1 fields are valid", async () => {
    renderSigninPage();

    fillStep1();

    await waitFor(() => {
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.PASSWORD);
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
    });
  });
});

describe("Component SigninPage: Step 2 Password Validation and Registration", () => {
  beforeEach(() => vi.clearAllMocks());

  test("SHOULD show the INVALID_PASSWORD message AND NOT call the registration API WHEN password validation fails", async () => {
    renderSigninPage();
    fillStep1();

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "123456" } });
    fireEvent.change(screen.getByTestId("confirm-input"), { target: { value: "123456" } });

    fireEvent.click(screen.getByText(/Join the Foxes/i));

    await waitFor(() => {
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.INVALID_PASSWORD);
      expect(mockUserRegister).not.toHaveBeenCalled();
    });
  });

  test("SHOULD call the user registration API with all data AND redirect to login WHEN all steps are successfully completed", async () => {
    mockUserRegister.mockResolvedValue({ success: true });

    renderSigninPage();
    fillStep1();

    await waitFor(() => screen.getByTestId("password-input"));

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Abc123!" } });
    fireEvent.change(screen.getByTestId("confirm-input"), { target: { value: "Abc123!" } });

    fireEvent.click(screen.getByText(/Join the Foxes/i));

    await waitFor(() => {
      expect(mockUserRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          username: "user001",
          email: "user@example.com",
          password: "Abc123!",
          fName: "John",
          lName: "Doe",
          balance: 0,
        })
      );

      expect(mockNavigate).toHaveBeenCalledWith("/auth/login");

      expect(screen.getByLabelText(/Username/i).value).toBe("");
      expect(screen.getByLabelText(/Email/i).value).toBe("");
      expect(screen.getByLabelText(/First name/i).value).toBe("");
      expect(screen.getByLabelText(/Last name/i).value).toBe("");
    });
  });

  test("SHOULD display a duplicate-username message WHEN the API reports the username already exists", async () => {
    mockUserRegister.mockResolvedValue({ success: false, errorCode: "USERNAME_EXIST" });

    renderSigninPage();
    fillStep1();

    await waitFor(() => screen.getByTestId("password-input"));

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Abc123!" } });
    fireEvent.change(screen.getByTestId("confirm-input"), { target: { value: "Abc123!" } });

    fireEvent.click(screen.getByText(/Join the Foxes/i));

    await waitFor(() => {
      expect(mockUserRegister).toHaveBeenCalled();
      expect(screen.getByText(/That username is already in use/i)).toBeInTheDocument();
    });
  });

  test("SHOULD display a duplicate-email message WHEN the API reports the email already exists", async () => {
    mockUserRegister.mockResolvedValue({ success: false, errorCode: "EMAIL_EXIST" });

    renderSigninPage();
    fillStep1();

    await waitFor(() => screen.getByTestId("password-input"));

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Abc123!" } });
    fireEvent.change(screen.getByTestId("confirm-input"), { target: { value: "Abc123!" } });

    fireEvent.click(screen.getByText(/Join the Foxes/i));

    await waitFor(() => {
      expect(mockUserRegister).toHaveBeenCalled();
      expect(screen.getByText(/That email is already associated with an account/i)).toBeInTheDocument();
    });
  });

  test("SHOULD display a generic signup failure message WHEN the API fails without a known error code", async () => {
    mockUserRegister.mockResolvedValue({ success: false, errorMessage: "something broke" });

    renderSigninPage();
    fillStep1();

    await waitFor(() => screen.getByTestId("password-input"));

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Abc123!" } });
    fireEvent.change(screen.getByTestId("confirm-input"), { target: { value: "Abc123!" } });

    fireEvent.click(screen.getByText(/Join the Foxes/i));

    await waitFor(() => {
      expect(mockUserRegister).toHaveBeenCalled();
      expect(screen.getByText(/Registration failed\. Please try again\./i)).toBeInTheDocument();
    });
  });

  test("SHOULD clear a displayed signup error WHEN the user edits the password field", async () => {
    mockUserRegister.mockResolvedValue({ success: false, errorMessage: "Registration failed. Please try again." });

    renderSigninPage();
    fillStep1();

    await waitFor(() => screen.getByTestId("password-input"));

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Abc123!" } });
    fireEvent.change(screen.getByTestId("confirm-input"), { target: { value: "Abc123!" } });
    fireEvent.click(screen.getByText(/Join the Foxes/i));

    await waitFor(() => {
      expect(screen.getByText(/Registration failed\. Please try again\./i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Abc123!9" } });

    await waitFor(() => {
      expect(screen.queryByText(/Registration failed\. Please try again\./i)).not.toBeInTheDocument();
    });
  });
});

describe("Component SigninPage", () => {
  beforeEach(() => {
    mockUserRegister = vi.fn();
    mockSetMessage = vi.fn();
    vi.clearAllMocks();
  });

  const invalidUsernames = [
    "short",
    "a".repeat(33),
    "user!",
    "user@name",
    "user name",
  ];

  const validUsernames = [
    "user123",
    "User_01",
    "username32characterslonggg",
  ];

  const invalidPasswords = [
    "short",
    "a".repeat(33),
    "abcdefgh",
    "12345678",
    "!!!!!!!!",
    "abcde123",
    "Abc!@#",
    "A1!@#",
    "pass word1!",
  ];

  const validPasswords = [
    "Abcd23!",
    "Password1@",
    "Aa1!@#$%^&*",
    "Zx9_@1234",
  ];

  describe("Validation", () => {
    test.each(validUsernames)(
      "Accepts valid username: '%s'",
      async (username) => {
        mockUserRegister.mockResolvedValue({ success: true });
        render(
          <MemoryRouter>
            <SigninPage />
          </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Username/i), { target: { value: username } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "user@example.com" } });
        fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: "John" } });
        fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: "Doe" } });

        fireEvent.click(screen.getByText(/Go to next step/i));

        const passwordInput = screen.getByTestId("password-input");
        const confirmInput = screen.getByTestId("confirm-input");
        const joinButton = screen.getByText(/Join the Foxes/i);

        fireEvent.change(passwordInput, { target: { value: "ValidPassword@123" } });
        fireEvent.change(confirmInput, { target: { value: "ValidPassword@123" } });

        fireEvent.click(joinButton);

        await waitFor(() => {
          expect(mockUserRegister).toHaveBeenCalledWith(
            expect.objectContaining({
              username,
              password: "ValidPassword@123",
            })
          );
        });
      }
    );


    test.each(invalidUsernames)(
      "Rejects invalid username: '%s'",
      async (username) => {
        render(
          <MemoryRouter>
            <SigninPage />
          </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByTestId("password-input");
        const loginButton = screen.getByText(/Join the Foxes/i);

        fireEvent.change(usernameInput, { target: { value: username } });
        fireEvent.change(passwordInput, { target: { value: "ValidPassword@123" } });
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(mockUserRegister).not.toHaveBeenCalled();
          expect(mockSetMessage).toHaveBeenCalledWith(Messages.INVALID_PASSWORD);
        });
      }
    );

    test.each(validPasswords)(
      "Accepts valid password: '%s'",
      async (password) => {
        mockUserRegister.mockResolvedValue({ success: true });
        render(
          <MemoryRouter>
            <SigninPage />
          </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByTestId("password-input");
        const confirmInput = screen.getByTestId("confirm-input");
        const loginButton = screen.getByText(/Join the Foxes/i);

        fireEvent.change(usernameInput, { target: { value: "ValidUser" } });
        fireEvent.change(passwordInput, { target: { value: password } });
        fireEvent.change(confirmInput, { target: { value: password } });
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(mockUserRegister).toHaveBeenCalledWith(
            expect.objectContaining({
              username: "ValidUser",
              password,
            })
          );
        });
      }
    );

    test.each(invalidPasswords)(
      "Rejects invalid password: '%s'",
      async (password) => {
        render(
          <MemoryRouter>
            <SigninPage />
          </MemoryRouter>
        );

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByTestId("password-input");
        const loginButton = screen.getByText(/Join the Foxes/i);

        fireEvent.change(usernameInput, { target: { value: "ValidUser" } });
        fireEvent.change(passwordInput, { target: { value: password } });
        fireEvent.click(loginButton);

        await waitFor(() => {
          expect(mockUserRegister).not.toHaveBeenCalled();
          expect(mockSetMessage).toHaveBeenCalledWith(Messages.INVALID_PASSWORD);
        });
      }
    );
  });
});
