<?php

namespace App\Policies;

use App\Models\Assembly;
use App\Models\User;

class AssemblyPolicy
{
    public function view(User $user, Assembly $assembly): bool
    {
        return (int) $assembly->user_id === (int) $user->id;
    }

    public function update(User $user, Assembly $assembly): bool
    {
        return (int) $assembly->user_id === (int) $user->id;
    }

    public function delete(User $user, Assembly $assembly): bool
    {
        return (int) $assembly->user_id === (int) $user->id;
    }
}
