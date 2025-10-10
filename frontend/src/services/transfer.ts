import { useAuth, useUsers } from '../stores';

export default function CreateTransfer() {
  const me = useAuth(); // ← теперь внутри функции
  const user = useUsers();

  try {
    const userInv = me.users?.inventories;
    console.log(userInv);
  } catch (error) {
    console.error(error);
  }
}
