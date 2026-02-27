<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OperationalCost;
use App\Models\Assignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OperationalCostController extends Controller
{
    public function index(Request $request)
    {
        $query = OperationalCost::with('assignment.report');

        if ($request->search) {
            $query->where('notes', 'like', '%' . $request->search . '%')
                ->orWhereHas('assignment.report', function ($q) use ($request) {
                    $q->where('description', 'like', '%' . $request->search . '%');
                });
        }

        if ($request->expense_type) {
            $query->where('expense_type', $request->expense_type);
        }

        if ($request->trashed === 'true') {
            $query->onlyTrashed();
        }

        return Inertia::render('Admin/OperationalCosts/Index', [
            'items' => $query->latest()->paginate(10)->withQueryString(),
            'filters' => $request->only(['search', 'expense_type', 'trashed']),
            'assignments' => Assignment::with('report')->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'assignment_id' => 'required|exists:assignments,id',
            'expense_type' => 'required|in:BBM,Alat Medis,Konsumsi,Lainnya',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        OperationalCost::create($validated);

        return back()->with('success', 'Operational cost recorded.');
    }

    public function update(Request $request, OperationalCost $operationalCost)
    {
        $validated = $request->validate([
            'assignment_id' => 'required|exists:assignments,id',
            'expense_type' => 'required|in:BBM,Alat Medis,Konsumsi,Lainnya',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $operationalCost->update($validated);

        return back()->with('success', 'Operational cost updated.');
    }

    public function destroy(OperationalCost $operationalCost)
    {
        $operationalCost->delete();
        return back()->with('success', 'Cost record moved to trash.');
    }

    public function restore($id)
    {
        OperationalCost::withTrashed()->findOrFail($id)->restore();
        return back()->with('success', 'Cost record restored.');
    }

    public function forceDelete($id)
    {
        OperationalCost::withTrashed()->findOrFail($id)->forceDelete();
        return back()->with('success', 'Cost record permanently deleted.');
    }
}
