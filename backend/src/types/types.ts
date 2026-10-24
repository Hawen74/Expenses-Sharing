export type Group = {
    id: number;
    name: string;
    created_at: Date;
    updated_at: Date;
};

export type Group_Member = {
    group_id: number;
    member_id: number;
    joined_at: Date;
}

export type Expense = {
    id: number;
    group_id: number;
    title: string;
    detail: string;
    amount: number;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}